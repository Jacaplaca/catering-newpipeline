// import { db } from '@root/app/server/db';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import type { MealType } from '@root/types/specific';
import { RoleType, type Client, type OrderStatus } from '@prisma/client';
// import processMeals from '@root/app/server/api/routers/specific/libs/processMeals';

// import { Document, Font, Page, StyleSheet, Text, View, Svg, Path, pdf as pdfRender } from '@react-pdf/renderer';
// import React from 'react';
import translate from '@root/app/lib/lang/translate';
import { format } from 'date-fns-tz';
import { pl } from 'date-fns/locale';
import { getDict } from '@root/app/server/cache/translations';
import { getOrdersPdf2Valid } from '@root/app/validators/specific/order';
import safeFileName from '@root/app/lib/safeFileName';
import PDFDocument from 'pdfkit';
import { db } from '@root/app/server/db';
import { loadFonts } from '@root/app/lib/loadFonts';
import dayIdParser from '@root/app/server/api/routers/specific/libs/dayIdParser';
import returnPdfForFront from '@root/app/server/api/routers/specific/libs/pdf/returnPdfForFront';
import { mealGroup2orderField } from '@root/app/assets/maps/catering';
import getGroupedFoodData from '@root/app/server/api/routers/specific/libs/pdf/getGroupedFoodData';
import cleanConsumerName from '@root/app/server/api/routers/specific/libs/consumerFoods/dayMenuPdf/cleanConsumerName';

// PDF Configuration
const pdfConfig = {
    margins: {
        default: 50,
        header: 0,
        footer: 0,
        content: {
            left: 50,
            right: 50,
            bottom: 20,
        },
        contentToFooter: 10, // Distance between content and footer
    }
};

const dayPdf2 = createCateringProcedure([RoleType.kitchen, RoleType.manager, RoleType.dietician])
    .input(getOrdersPdf2Valid)
    .query(async ({ input, ctx }) => {
        const { session: { catering } } = ctx;
        const { dayId, mealId, lang } = input;

        const { consumerFoodByRoute, mealGroupName, orderIds, mealGroupId } = await getGroupedFoodData({ dayId, mealId, cateringId: catering.id, groupBy: 'byMeal' });

        // ZMODYFIKOWANE ZAPYTANIE dayData
        const dayData = await db.order.aggregateRaw({
            pipeline: [
                {
                    $match: {
                        // Używamy wcześniej pobranych ID, co jest bardzo wydajne
                        _id: { $in: orderIds },
                        // Alternatywnie można powtórzyć warunki z findMany, ale $in na _id jest szybsze
                    }
                },
                {
                    $lookup: {
                        from: 'Client',
                        localField: 'clientId',
                        foreignField: '_id',
                        as: 'client'
                    }
                },
                {
                    $unwind: '$client'
                },
                {
                    $lookup: {
                        from: 'DeliveryRoute',
                        localField: 'client.deliveryRouteId',
                        foreignField: '_id',
                        as: 'deliveryRoute'
                    }
                },
                {
                    $unwind: {
                        path: '$deliveryRoute',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // --- USUNIĘTY KOSZTOWNY LOOKUP ---
                // {
                //     $lookup: { ... } 
                // },
                {
                    $addFields: {
                        standard: `$${mealGroup2orderField[mealGroupId as MealType].standard}`,
                    }
                },
                {
                    $project: {
                        _id: 1,
                        cateringId: 1,
                        clientId: 1,
                        client: 1,
                        status: 1,
                        standard: 1,
                        // diet: 1, // --- USUNIĘTE ---
                        deliveryDay: 1,
                        notes: 1,
                        sentToCateringAt: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        deliveryRoute: 1
                    }
                }
            ]
        }) as unknown as {
            _id: string;
            client: Client & { _id: string };
            status: OrderStatus;
            sentToCateringAt: { $date: Date };
            standard: number;
            notes: string; // Ta wartość zostanie nadpisana przez logikę debugową poniżej
            // diet: (OrderConsumerBreakfast & OrderMealPopulated)[];
            deliveryRoute?: { code: string; name: string; _id: string };
        }[];



        const summaryStandard = dayData.reduce((acc, { standard }) => {
            acc += standard;
            return acc;
        }, 0);

        // Przetwarzamy notatki, mapując je do kodów klienta
        const notes = dayData.reduce((acc, { notes, client }) => {
            const code = client?.info?.code;
            if (code && notes) { // Dodajemy notatkę tylko jeśli istnieje - zachowano logikę debugową
                acc[code] = notes;
                // --- KONIEC ZMIAN: Użycie funkcji losowego lorem ipsum ---
            }
            return acc;
        }, {} as Record<string, string>);

        const standardObject = dayData.reduce((acc, { client, standard, deliveryRoute }) => {
            const code = client?.info?.code;
            if (code) {
                if (!acc[code]) {
                    acc[code] = { meals: 0, deliveryRouteInfo: '' };
                }
                acc[code].meals += standard;
                if (deliveryRoute && !acc[code].deliveryRouteInfo) {
                    acc[code].deliveryRouteInfo = deliveryRoute.name;
                }
            }
            return acc;
        }, {} as Record<string, { meals: number; deliveryRouteInfo: string }>);

        const dietDataByClient = Object.entries(consumerFoodByRoute).reduce((acc, [_routeId, routeData]) => {
            const { deliveryRouteName, clients } = routeData;

            Object.entries(clients).forEach(([_clientId, clientData]) => {
                const { clientCode, meals } = clientData;

                if (!acc[clientCode]) {
                    acc[clientCode] = { mealsByMealName: {}, deliveryRouteInfo: deliveryRouteName };
                }

                Object.entries(meals).forEach(([_mealId, mealData]) => {
                    const { meal, consumers } = mealData;
                    const mealName = meal.name;

                    if (!acc[clientCode]?.mealsByMealName[mealName]) {
                        if (!acc[clientCode]) {
                            acc[clientCode] = { mealsByMealName: {}, deliveryRouteInfo: deliveryRouteName };
                        }
                        const firstConsumerData = Object.values(consumers)[0];
                        const foodItems = firstConsumerData?.consumerFoods ?? [];
                        const sortedFoodItems = foodItems.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                        const baseFoodName = sortedFoodItems.map(item => item.food.name).join(', ');


                        acc[clientCode].mealsByMealName[mealName] = {
                            baseFoodName,
                            consumers: [],
                        };
                    }

                    Object.entries(consumers).forEach(([_consumerId, consumerData]) => {
                        const { consumer, consumerFoods } = consumerData;

                        let dietInfo = '';
                        if (consumer.diet) {
                            // removed description
                            const { code } = consumer.diet;
                            const parts = [code].filter(Boolean);
                            if (parts.length > 0) {
                                dietInfo = ` --${parts.join(', ')}--`;
                            }
                        }

                        const dietDescriptionParts: { text: string, font: string }[] = [];
                        const consumerFoodsChanges = consumerFoods
                            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                            .map(cf => {
                                const parts: { text: string, font: string }[] = [];
                                const hasAlternative = !!cf.alternativeFood;
                                const hasExclusions = cf.exclusions && cf.exclusions.length > 0;
                                const hasComment = !!cf.comment;

                                if (!hasAlternative && !hasExclusions && !hasComment) {
                                    return null;
                                }

                                parts.push({ text: `${cf.food.name}: `, font: 'Roboto' });

                                const changeParts: { text: string, font: string }[] = [];

                                if (cf.alternativeFood?.name) {
                                    changeParts.push({ text: `${cf.alternativeFood.name}`, font: 'Roboto-Bold' });
                                }

                                if (hasExclusions) {
                                    const exclusionsString = `(${cf.exclusions.map(ex => ex.name).join(', ')})`;
                                    changeParts.push({ text: exclusionsString, font: 'Roboto-BoldItalic' });
                                }

                                if (cf.comment) {
                                    changeParts.push({ text: `${cf.comment}`, font: 'Roboto-Bold' });
                                }

                                for (let i = 0; i < changeParts.length; i++) {
                                    const part = changeParts[i];
                                    if (part) {
                                        parts.push(part);
                                        if (i < changeParts.length - 1) {
                                            parts.push({ text: ' ', font: 'Roboto' });
                                        }
                                    }
                                }

                                return parts;
                            })
                            .filter(Boolean) as { text: string, font: string }[][];

                        consumerFoodsChanges.forEach((change, index) => {
                            if (index < consumerFoodsChanges.length - 1) {
                                const lastPart = change[change.length - 1];
                                if (lastPart) {
                                    lastPart.text += '; ';
                                }
                            }
                            dietDescriptionParts.push(...change);
                        });

                        let consumerCode = consumer.code ?? 'UNKNOWN';
                        // Use cleanConsumerName to clean up consumer code based on client code
                        consumerCode = cleanConsumerName(consumer.code, clientCode);

                        acc[clientCode]?.mealsByMealName[mealName]?.consumers.push({
                            consumerCode,
                            dietInfo,
                            dietDescriptionParts,
                        });
                    });
                });
            });

            return acc;
        }, {} as Record<string, {
            mealsByMealName: Record<string, {
                baseFoodName: string;
                consumers: {
                    consumerCode: string;
                    dietInfo: string;
                    dietDescriptionParts: { text: string, font: string }[];
                }[];
            }>,
            deliveryRouteInfo: string
        }>);


        const standard = Object.entries(standardObject).map(([clientCode, { meals, deliveryRouteInfo }]) => ({
            clientCode,
            meals,
            deliveryRouteInfo
        })).filter(({ meals }) => meals).sort((a, b) => a.clientCode.localeCompare(b.clientCode));

        // Group standard orders by delivery route
        const standardGroupedByRoute = standard.reduce((acc, item) => {
            const routeKey = item.deliveryRouteInfo || 'Bez trasy'; // Fallback for items without route
            if (!acc[routeKey]) {
                acc[routeKey] = [];
            }
            acc[routeKey].push(item);
            return acc;
        }, {} as Record<string, typeof standard>);

        // Calculate total consumers without changes from already computed data
        const totalConsumersWithoutChanges = Object.values(consumerFoodByRoute).reduce((total, routeData) => {
            return total + routeData.consumersWithoutChangesCount;
        }, 0);

        const summaryNewTotal = summaryStandard + totalConsumersWithoutChanges;
        const hasTotalNoChanges = totalConsumersWithoutChanges > 0;

        const dictionary = await getDict({ lang, keys: ['shared', 'orders', 'menu-creator'] })
        const { year, month, day } = dayIdParser(dayId);
        const deliveryDayDate = new Date(year, month, day);

        const headDate = format(deliveryDayDate, "EEEE d MMM yyyy ", { locale: pl });
        const footerDate = format(deliveryDayDate, "d-MM-yyyy ", { locale: pl });
        const fileNameDate = format(deliveryDayDate, "yyyy-MM-dd ", { locale: pl });

        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: pdfConfig.margins.default,
                bufferPages: true,
                font: ''
            });

            const buffers: Buffer[] = [];
            doc.on('data', (chunk: Buffer) => buffers.push(chunk));

            const pdfPromise = new Promise<Buffer>((resolve) => {
                doc.on('end', () => resolve(Buffer.concat(buffers)));
            });

            const fonts = await loadFonts();

            doc.registerFont('Roboto', fonts.regular);
            doc.registerFont('Roboto-Bold', fonts.bold);
            doc.registerFont('Roboto-BoldItalic', fonts.boldItalic);

            doc.font('Roboto-Bold')
                .fontSize(20)
                .text(translate(dictionary, 'orders:title'), { align: 'center' });

            doc.moveDown();
            doc.fontSize(16)
                .text(`${mealGroupName} - ${headDate}`, { align: 'center' });

            doc.moveDown(2);

            // Build the complete summary text first
            const summaryLabel = `${translate(dictionary, 'orders:standard')}: `;
            let summaryText = summaryLabel + summaryStandard.toString();
            if (hasTotalNoChanges) {
                summaryText += ` (+${totalConsumersWithoutChanges}) ${summaryNewTotal}`;
            }

            // Calculate center position for the entire line
            doc.fontSize(14); // Set font size first for width calculation
            const summaryWidth = doc.widthOfString(summaryText);
            const centerX = (doc.page.width - summaryWidth) / 2;

            // Render with proper formatting
            doc.fontSize(14)
                .font('Roboto-Bold')
                .text(summaryLabel, centerX, doc.y, { continued: true });

            // Old standard count (bold only if no changes)
            doc.font(hasTotalNoChanges ? 'Roboto' : 'Roboto-Bold')
                .fontSize(14)
                .text(summaryStandard.toString(), { continued: hasTotalNoChanges });

            if (hasTotalNoChanges) {
                // (+no_changes) - not bold
                doc.font('Roboto')
                    .fontSize(14)
                    .text(` (+${totalConsumersWithoutChanges}) `, { continued: true });

                // New total - bold
                doc.font('Roboto-Bold')
                    .fontSize(14)
                    .text(summaryNewTotal.toString(), { continued: false });
            }

            const startY = doc.y + 20;
            const pageWidth = doc.page.width - (pdfConfig.margins.content.left + pdfConfig.margins.content.right);
            // --- Usunięto ratio, szerokość będzie obliczana dynamicznie ---
            // const clientCodeWidthRatio = 0.7;
            // const mealsWidthRatio = 0.3;

            let yPosition = startY;

            // Helper function to determine number of columns based on client count
            const getColumnCount = (clientCount: number): number => {
                if (clientCount === 1) return 1;
                if (clientCount === 2) return 2;
                return 3; // For 3 or more clients
            };

            // Helper function to draw vertical lines for table
            const drawVerticalLines = (yPos: number, height: number, columnWidths: number[], pageContentLeft: number) => {
                let currentX = pageContentLeft;
                doc.lineWidth(0.25).strokeColor('grey');

                for (let i = 0; i < columnWidths.length - 1; i++) {
                    currentX += columnWidths[i]!;
                    doc.moveTo(currentX, yPos).lineTo(currentX, yPos + height).stroke();
                }
                doc.strokeColor('black'); // Reset stroke color
            };

            // Helper function to render a table cell with client data
            const renderClientCell = (
                clientData: { clientCode: string; meals: number; deliveryRouteInfo: string },
                routeData: { clients?: Record<string, { clientCode: string; consumersWithoutChangesCount?: number }> } | undefined,
                x: number,
                y: number,
                width: number,
                height: number,
                cellPadding: number,
                cellFontSize: number,
                actualTextPaddingY: number
            ) => {
                const item = clientData;
                const noteText = notes[item.clientCode];

                const oldMeals = item.meals;
                const oldMealsText = oldMeals.toString();

                // Get client data from consumerFoodByRoute
                const clientDataExtended = Object.values(routeData?.clients ?? {}).find(
                    (client) => client.clientCode === item.clientCode
                );
                const clientConsumersWithoutChanges = clientDataExtended?.consumersWithoutChangesCount ?? 0;

                const hasNoChanges = clientConsumersWithoutChanges > 0;
                const noChangesText = hasNoChanges ? ` (+${clientConsumersWithoutChanges})` : '';
                const newTotal = oldMeals + clientConsumersWithoutChanges;
                const newTotalText = newTotal.toString();

                const clientCodeText = item.clientCode;

                // Calculate available width for text
                const textWidth = width - (2 * cellPadding);

                // Render client code
                doc.font('Roboto')
                    .fontSize(cellFontSize)
                    .fillColor('black')
                    .text(clientCodeText, x + cellPadding, y + actualTextPaddingY, {
                        width: textWidth,
                        lineBreak: false,
                        ellipsis: true,
                        continued: true
                    });

                // Position for meals display
                const clientCodeWidth = doc.widthOfString(clientCodeText);
                const mealsX = x + cellPadding + clientCodeWidth + 3;

                // Check if we have enough space for meals on the same line
                const remainingWidth = x + width - cellPadding - mealsX;
                const mealsText = hasNoChanges ? `${oldMealsText}${noChangesText} ${newTotalText}` : oldMealsText;
                const mealsTextWidth = doc.widthOfString(mealsText);

                if (remainingWidth >= mealsTextWidth) {
                    // Render on same line
                    doc.text(' ', { continued: true }); // Small space

                    // Render old meals count (bold only if no changes)
                    doc.font(hasNoChanges ? 'Roboto' : 'Roboto-Bold')
                        .fontSize(cellFontSize)
                        .text(oldMealsText, { continued: hasNoChanges });

                    if (hasNoChanges) {
                        // Render (+no_changes)
                        doc.font('Roboto')
                            .fontSize(cellFontSize)
                            .text(noChangesText, { continued: true });

                        // Render new total (always bold)
                        doc.font('Roboto-Bold')
                            .fontSize(cellFontSize)
                            .text(` ${newTotalText}`, { continued: false });
                    }
                } else {
                    // Render on new line
                    doc.text('', { continued: false }); // End current line

                    // Render old meals count (bold only if no changes)
                    doc.font(hasNoChanges ? 'Roboto' : 'Roboto-Bold')
                        .fontSize(cellFontSize)
                        .text(oldMealsText, x + cellPadding, y + actualTextPaddingY + (cellFontSize + 2), {
                            width: textWidth,
                            continued: hasNoChanges
                        });

                    if (hasNoChanges) {
                        // Render (+no_changes)
                        doc.font('Roboto')
                            .fontSize(cellFontSize)
                            .text(noChangesText, { continued: true });

                        // Render new total (always bold)
                        doc.font('Roboto-Bold')
                            .fontSize(cellFontSize)
                            .text(` ${newTotalText}`, { continued: false });
                    }
                }

                // Render note if present
                if (noteText) {
                    const noteY = y + height - (cellFontSize + 2);
                    doc.font('Roboto')
                        .fontSize(8)
                        .fillColor('dimgray')
                        .text(noteText, x + cellPadding, noteY, {
                            width: textWidth,
                            lineBreak: true,
                            height: cellFontSize + 2
                        });
                    doc.fillColor('black'); // Reset color
                }
            };

            // Render grouped standard orders - sort routes alphabetically
            Object.entries(standardGroupedByRoute)
                .sort(([a], [b]) => a.localeCompare(b))
                .forEach(([routeName, routeItems]) => {
                    // Calculate total meals for this route (old meals)
                    const routeTotalOldMeals = routeItems.reduce((sum, item) => sum + item.meals, 0);

                    // Get route data from consumerFoodByRoute to get already calculated consumers without changes
                    const routeData = Object.values(consumerFoodByRoute).find(route =>
                        route.deliveryRouteName === routeName ||
                        (routeName === 'Bez trasy' && route.deliveryRouteName === 'Bez trasy')
                    );
                    const routeStandardConsumersWithoutChanges = routeData?.consumersWithoutChangesCount ?? 0;

                    // Calculate new total (old + no changes)
                    const routeTotalNewMeals = routeTotalOldMeals + routeStandardConsumersWithoutChanges;
                    const hasRouteNoChanges = routeStandardConsumersWithoutChanges > 0;

                    // Estimate minimum space needed for route header + first table row
                    const routeHeaderHeight = 25;
                    const tableRowHeight = 40; // Estimated height for table row
                    const minSpaceNeeded = routeHeaderHeight + tableRowHeight;

                    // Check if we need a new page for the route header + at least one row
                    if (yPosition + minSpaceNeeded > doc.page.height - doc.page.margins.bottom - pdfConfig.margins.contentToFooter) {
                        doc.addPage();
                        yPosition = doc.page.margins.top;
                    }

                    // Route header with formatted meals display - centered
                    // Build the complete route text first
                    const routeLabel = `${routeName} `;
                    let routeText = routeLabel + routeTotalOldMeals.toString();
                    if (hasRouteNoChanges) {
                        routeText += ` (+${routeStandardConsumersWithoutChanges}) ${routeTotalNewMeals}`;
                    }

                    // Calculate center position for the entire line
                    doc.fontSize(14); // Set font size first for width calculation
                    const routeWidth = doc.widthOfString(routeText);
                    const centerX = (doc.page.width - routeWidth) / 2;

                    // Render with proper formatting - centered
                    doc.fontSize(14)
                        .font('Roboto-Bold')
                        .fillColor('black')
                        .text(routeLabel, centerX, yPosition, { continued: true });

                    // Old meals count (bold only if no changes)
                    doc.font(hasRouteNoChanges ? 'Roboto' : 'Roboto-Bold')
                        .fontSize(14)
                        .text(routeTotalOldMeals.toString(), { continued: hasRouteNoChanges });

                    if (hasRouteNoChanges) {
                        // (+no_changes) - not bold
                        doc.font('Roboto')
                            .fontSize(14)
                            .text(` (+${routeStandardConsumersWithoutChanges}) `, { continued: true });

                        // New total - bold
                        doc.font('Roboto-Bold')
                            .fontSize(14)
                            .text(routeTotalNewMeals.toString(), { continued: false });
                    }

                    yPosition += 25; // Space after route header

                    // Table settings similar to routesPdf.ts
                    const cellFontSize = 9;
                    const baseRowPaddingY = 4;
                    let rowHeight = cellFontSize + (2 * baseRowPaddingY) + 2;
                    rowHeight *= 1.8; // Increase row height for better note visibility
                    const actualTextPaddingY = (rowHeight - cellFontSize - 2) / 2;

                    const pageContentLeft = pdfConfig.margins.content.left;
                    const pageContentWidth = pageWidth;
                    const cellHorizontalPadding = 4;

                    // Determine number of columns and column widths
                    const columnCount = getColumnCount(routeItems.length);
                    const columnWidths: number[] = new Array(columnCount).fill(pageContentWidth / columnCount) as number[];

                    // Group items into rows
                    type RouteItem = { clientCode: string; meals: number; deliveryRouteInfo: string };
                    const rows: RouteItem[][] = [];
                    for (let i = 0; i < routeItems.length; i += columnCount) {
                        rows.push(routeItems.slice(i, i + columnCount));
                    }

                    // Render table rows
                    rows.forEach((row, _rowIndex) => {
                        // Check if current row fits on page
                        if (yPosition + rowHeight > doc.page.height - doc.page.margins.bottom - pdfConfig.margins.contentToFooter) {
                            doc.addPage();
                            yPosition = doc.page.margins.top;
                        }

                        const currentRowY = yPosition;

                        // Render cells in this row
                        row.forEach((item, colIndex) => {
                            const cellX = pageContentLeft + (colIndex * columnWidths[0]!);
                            const cellWidth = columnWidths[0]!;

                            renderClientCell(
                                item,
                                routeData,
                                cellX,
                                currentRowY,
                                cellWidth,
                                rowHeight,
                                cellHorizontalPadding,
                                cellFontSize,
                                actualTextPaddingY
                            );
                        });

                        // Draw vertical lines for this row
                        drawVerticalLines(currentRowY, rowHeight, columnWidths, pageContentLeft);

                        // Draw horizontal line at bottom of row
                        doc.lineWidth(0.25)
                            .strokeColor('grey')
                            .moveTo(pageContentLeft, currentRowY + rowHeight)
                            .lineTo(pageContentLeft + pageContentWidth, currentRowY + rowHeight)
                            .stroke()
                            .strokeColor('black');

                        yPosition += rowHeight;
                    });

                    // Add extra space between route groups
                    yPosition += 15;
                });

            doc.y = yPosition; // Ustaw pozycję Y dla sekcji diet

            doc.x = pdfConfig.margins.content.left;

            // Always start diets on a new page
            doc.addPage();
            doc.y = doc.page.margins.top;

            // doc.moveDown(4)
            //     .fontSize(14)
            //     .font('Roboto-Bold')
            //     .fillColor('black')
            //     .text(translate(dictionary, 'orders:diet'), {
            //         width: pageWidth,
            //         align: 'center'
            //     });

            // Group diet orders by delivery route
            const dietGroupedByRoute = Object.entries(dietDataByClient)
                .filter(([_, { mealsByMealName }]) => Object.keys(mealsByMealName).length > 0)
                .reduce((acc, [clientCode, { mealsByMealName, deliveryRouteInfo }]) => {
                    const routeKey = deliveryRouteInfo || 'Bez trasy';
                    if (!acc[routeKey]) {
                        acc[routeKey] = [];
                    }
                    acc[routeKey].push({
                        clientCode,
                        mealsByMealName,
                        deliveryRouteInfo
                    });
                    return acc;
                }, {} as Record<string, Array<{
                    clientCode: string;
                    mealsByMealName: Record<string, {
                        baseFoodName: string;
                        consumers: {
                            consumerCode: string;
                            dietInfo: string;
                            dietDescriptionParts: { text: string, font: string }[];
                        }[];
                    }>,
                    deliveryRouteInfo: string
                }>>);

            let isFirstDietRoute = true;
            Object.entries(dietGroupedByRoute)
                .sort(([a], [b]) => a.localeCompare(b))
                .forEach(([routeName, routeClients]) => {
                    // Start each diet route on a new page, except the first one
                    if (!isFirstDietRoute) {
                        doc.addPage();
                        doc.y = doc.page.margins.top;
                    }
                    isFirstDietRoute = false;

                    // Get route data from consumerFoodByRoute to get already calculated consumers without changes
                    const routeData = Object.values(consumerFoodByRoute).find(route =>
                        route.deliveryRouteName === routeName ||
                        (routeName === 'Bez trasy' && route.deliveryRouteName === 'Bez trasy')
                    );
                    const routeTotalConsumersWithoutChanges = routeData?.consumersWithoutChangesCount ?? 0;
                    const routeSuffix = routeTotalConsumersWithoutChanges > 0 ? ` (-${routeTotalConsumersWithoutChanges})` : '';

                    // Route header for diets
                    doc.moveDown()
                        .fontSize(14)
                        .font('Roboto-Bold')
                        .fillColor('black')
                        .text(`Trasa: ${routeName}${routeSuffix}`, pdfConfig.margins.content.left);

                    // Sort clients alphabetically before rendering
                    const sortedRouteClients = routeClients.sort((a, b) => a.clientCode.localeCompare(b.clientCode));

                    // Render clients for this route
                    sortedRouteClients.forEach(({ clientCode, mealsByMealName }) => {
                        // Check space for client header + at least one diet item
                        const clientSpaceNeeded = 20 + 12 + 11; // 20 points for moveDown, 12 points for client fontSize, 11 points for diet item

                        if (doc.y + clientSpaceNeeded > doc.page.height - doc.page.margins.bottom - pdfConfig.margins.contentToFooter) {
                            doc.addPage();
                            doc.y = doc.page.margins.top;
                        }

                        // Get client data from consumerFoodByRoute to get already calculated consumers without changes
                        // Find client by clientCode since consumerFoodByRoute is indexed by clientId
                        const clientData = Object.values(routeData?.clients ?? {}).find(client => client.clientCode === clientCode);
                        const maxConsumersWithoutChanges = clientData?.consumersWithoutChangesCount ?? 0;
                        const clientSuffix = maxConsumersWithoutChanges > 0 ? ` (-${maxConsumersWithoutChanges})` : '';

                        doc.moveDown()
                            .fontSize(12)
                            .font('Roboto-Bold')
                            .text(`${clientCode}${clientSuffix}`, 70)
                            .font('Roboto');

                        // Find consumers without changes across ALL meals for this client
                        const mealNames = Object.keys(mealsByMealName);
                        const hasMultipleMeals = mealNames.length > 1;
                        let consumersWithoutChangesInAllMeals: string[] = [];

                        if (hasMultipleMeals) {
                            // Get all consumers from first meal
                            const firstMealConsumers = Object.values(mealsByMealName)[0]?.consumers ?? [];
                            const allConsumerCodes = firstMealConsumers.map(c => c.consumerCode);

                            // Check which consumers have no changes in ALL meals
                            consumersWithoutChangesInAllMeals = allConsumerCodes.filter(consumerCode => {
                                return mealNames.every(mealName => {
                                    const meal = mealsByMealName[mealName];
                                    const consumer = meal?.consumers.find(c => c.consumerCode === consumerCode);
                                    return consumer && consumer.dietDescriptionParts.length === 0;
                                });
                            });
                        }

                        Object.entries(mealsByMealName).forEach(([mealName, mealDetails]) => {
                            if (doc.y + 20 > doc.page.height - doc.page.margins.bottom - pdfConfig.margins.contentToFooter) {
                                doc.addPage();
                                doc.y = doc.page.margins.top;
                            }

                            // Count consumers without changes - use already calculated data
                            const mealData = Object.values(clientData?.meals ?? {}).find(meal => meal.meal.name === mealName);
                            const consumersWithoutChangesCount = mealData?.consumersWithoutChangesCount ?? 0;
                            const countSuffix = consumersWithoutChangesCount > 0 ? ` -${consumersWithoutChangesCount}` : '';

                            doc.moveDown(0.5);
                            doc.fontSize(11).font('Roboto-Bold').text(`${mealName} (${mealDetails.baseFoodName})${countSuffix}`, 80);
                            doc.font('Roboto');

                            const consumersWithChanges = mealDetails.consumers
                                .filter(diet => diet.dietDescriptionParts.length > 0)
                                .sort((a, b) => a.consumerCode.localeCompare(b.consumerCode));
                            const consumersWithoutChanges = mealDetails.consumers
                                .filter(diet => diet.dietDescriptionParts.length === 0)
                                .sort((a, b) => a.consumerCode.localeCompare(b.consumerCode));

                            if (consumersWithChanges.length > 0) {
                                consumersWithChanges.forEach(diet => {
                                    if (doc.y + 15 > doc.page.height - doc.page.margins.bottom - pdfConfig.margins.contentToFooter) {
                                        doc.addPage();
                                        doc.y = doc.page.margins.top;
                                    }

                                    const consumerCodeText = diet.consumerCode;
                                    const dietInfoText = `${diet.dietInfo}: `;

                                    doc.font('Roboto-Bold').fontSize(10).text(consumerCodeText, 90, doc.y, { continued: true });
                                    doc.font('Roboto').fontSize(10).text(dietInfoText, { continued: true });

                                    diet.dietDescriptionParts.forEach((part, index) => {
                                        const isLastPart = index === diet.dietDescriptionParts.length - 1;
                                        doc.font(part.font).fontSize(10).text(part.text, {
                                            continued: !isLastPart,
                                        });
                                    });
                                    doc.moveDown(0.25);
                                });
                            }

                            if (consumersWithoutChanges.length > 0) {
                                if (doc.y + 15 > doc.page.height - doc.page.margins.bottom - pdfConfig.margins.contentToFooter) {
                                    doc.addPage();
                                    doc.y = doc.page.margins.top;
                                }

                                const noChangesText = consumersWithoutChanges.map(diet => `${diet.consumerCode}${diet.dietInfo}`).join(', ');
                                const label = `${translate(dictionary, 'menu-creator:no-changes')}: `;

                                doc.fontSize(10).font('Roboto-Bold').text(label, 90, doc.y, { continued: true });
                                doc.font('Roboto').text(noChangesText, {
                                    width: doc.page.width - 120
                                });
                            }
                        });

                        // Add "Bez zmian we wszystkich posiłkach" section if client has multiple meals
                        if (hasMultipleMeals) {
                            if (doc.y + 15 > doc.page.height - doc.page.margins.bottom - pdfConfig.margins.contentToFooter) {
                                doc.addPage();
                                doc.y = doc.page.margins.top;
                            }

                            doc.moveDown(0.5);
                            const label = `Bez zmian we wszystkich posiłkach: `;
                            const noChangesInAllMealsText = consumersWithoutChangesInAllMeals.length > 0
                                ? consumersWithoutChangesInAllMeals.join(', ')
                                : 'Brak takich konsumentów';

                            doc.fontSize(10).font('Roboto-Bold').text(label, 80, doc.y, { continued: true });
                            doc.font('Roboto').text(noChangesInAllMealsText, {
                                width: doc.page.width - 110
                            });
                        }
                    });

                    // Add space between route groups
                    doc.moveDown();
                });

            const range = doc.bufferedPageRange();
            for (let i = range.start; i <= range.start + range.count - 1; i++) {
                doc.switchToPage(i);

                const currentY = doc.y;
                const originalMargins = { ...doc.page.margins };

                doc.page.margins = {
                    top: pdfConfig.margins.header,
                    bottom: pdfConfig.margins.footer,
                    left: pdfConfig.margins.header,
                    right: pdfConfig.margins.header
                };

                doc.fontSize(10)
                    .font('Roboto')
                    .fillColor('black')
                    .text(
                        `${footerDate}     ${i + 1}/${range.count}     ${mealGroupName}`,
                        0,
                        doc.page.height - pdfConfig.margins.content.bottom,
                        {
                            align: 'center',
                            width: doc.page.width,
                        }
                    );

                doc.page.margins = originalMargins;
                doc.y = currentY;
            }


            doc.end();

            const fileName = `${safeFileName(mealGroupName)}_${fileNameDate}.pdf`
            const newPromise = new Promise<{ fileName: string; pdfPromise: Promise<Buffer> }>((resolve) => {
                resolve({ fileName, pdfPromise });
            });

            return returnPdfForFront(newPromise);
        } catch (error) {
            console.error('Błąd podczas generowania PDF:', error);
            throw error;
        }

    });

export default dayPdf2;