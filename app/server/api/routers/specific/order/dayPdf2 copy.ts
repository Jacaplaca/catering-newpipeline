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
        })).filter(({ meals }) => meals);

        // Group standard orders by delivery route
        const standardGroupedByRoute = standard.reduce((acc, item) => {
            const routeKey = item.deliveryRouteInfo || 'Bez trasy'; // Fallback for items without route
            if (!acc[routeKey]) {
                acc[routeKey] = [];
            }
            acc[routeKey].push(item);
            return acc;
        }, {} as Record<string, typeof standard>);

        // Calculate total consumers without changes across all clients
        const totalConsumersWithoutChanges = Object.values(dietDataByClient).reduce((total, clientData) => {
            const clientMaxConsumersWithoutChanges = Math.max(...Object.values(clientData.mealsByMealName).map(mealDetails =>
                mealDetails.consumers.filter(diet => diet.dietDescriptionParts.length === 0).length
            ));
            return total + (clientMaxConsumersWithoutChanges > 0 ? clientMaxConsumersWithoutChanges : 0);
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
                margin: 50,
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
            const pageWidth = doc.page.width - 100; // margin left 50 + margin right 50
            const noteFontSize = 9;
            const lineHeight = 15; // Podstawowa wysokość linii dla klienta/ilości
            const verticalGap = 5; // Odstęp między wpisami
            // --- Usunięto ratio, szerokość będzie obliczana dynamicznie ---
            // const clientCodeWidthRatio = 0.7;
            // const mealsWidthRatio = 0.3;

            let yPosition = startY;

            // Render grouped standard orders
            Object.entries(standardGroupedByRoute).forEach(([routeName, routeItems]) => {
                // Calculate total meals for this route (old meals)
                const routeTotalOldMeals = routeItems.reduce((sum, item) => sum + item.meals, 0);

                // Calculate total consumers without changes for this route in standard section
                const routeStandardConsumersWithoutChanges = routeItems.reduce((routeSum, item) => {
                    const clientDietData = dietDataByClient[item.clientCode];
                    let clientConsumersWithoutChanges = 0;
                    if (clientDietData) {
                        clientConsumersWithoutChanges = Math.max(...Object.values(clientDietData.mealsByMealName).map(mealDetails =>
                            mealDetails.consumers.filter(diet => diet.dietDescriptionParts.length === 0).length
                        ));
                    }
                    return routeSum + (clientConsumersWithoutChanges > 0 ? clientConsumersWithoutChanges : 0);
                }, 0);

                // Calculate new total (old + no changes)
                const routeTotalNewMeals = routeTotalOldMeals + routeStandardConsumersWithoutChanges;
                const hasRouteNoChanges = routeStandardConsumersWithoutChanges > 0;

                // Estimate minimum space needed for route header + first item
                const routeHeaderHeight = 25;
                const minItemHeight = lineHeight + verticalGap; // Minimum for one item without notes
                const minSpaceNeeded = routeHeaderHeight + minItemHeight;

                // Check if we need a new page for the route header + at least one item
                if (yPosition + minSpaceNeeded > doc.page.height - doc.page.margins.bottom - 30) {
                    doc.addPage();
                    yPosition = doc.page.margins.top;
                }

                // Route header with formatted meals display
                doc.font('Roboto-Bold')
                    .fontSize(14)
                    .fillColor('black')
                    .text(`Trasa: ${routeName} `, 50, yPosition, {
                        lineBreak: false,
                        continued: true
                    });

                // Old meals count (bold only if no changes)
                doc.font(hasRouteNoChanges ? 'Roboto' : 'Roboto-Bold')
                    .fontSize(14)
                    .text(routeTotalOldMeals.toString(), {
                        lineBreak: false,
                        continued: hasRouteNoChanges
                    });

                if (hasRouteNoChanges) {
                    // (+no_changes) - not bold
                    doc.font('Roboto')
                        .fontSize(14)
                        .text(` (+${routeStandardConsumersWithoutChanges}) `, {
                            lineBreak: false,
                            continued: true
                        });

                    // New total - bold
                    doc.font('Roboto-Bold')
                        .fontSize(14)
                        .text(routeTotalNewMeals.toString(), {
                            lineBreak: false,
                            continued: true
                        });
                }

                // Close parenthesis
                // doc.font('Roboto-Bold')
                //     .fontSize(14)
                //     .text('', {
                //         lineBreak: false,
                //         continued: false
                //     });

                yPosition += 25; // Space after route header

                // Render items for this route
                routeItems.forEach(item => {
                    const noteText = notes[item.clientCode];
                    let itemHeight = lineHeight;
                    let noteHeight = 0;

                    if (noteText) {
                        noteHeight = doc.heightOfString(noteText, {
                            width: pageWidth - 10,
                        });
                        itemHeight += noteHeight;
                    }
                    itemHeight += verticalGap;

                    if (yPosition + itemHeight > doc.page.height - doc.page.margins.bottom - 30) {
                        doc.addPage();
                        yPosition = doc.page.margins.top;
                    }

                    const clientX = 50;
                    const oldMeals = item.meals;
                    const oldMealsText = oldMeals.toString();

                    // Get diet data for this client to calculate consumers without changes
                    const clientDietData = dietDataByClient[item.clientCode];
                    let clientConsumersWithoutChanges = 0;
                    if (clientDietData) {
                        clientConsumersWithoutChanges = Math.max(...Object.values(clientDietData.mealsByMealName).map(mealDetails =>
                            mealDetails.consumers.filter(diet => diet.dietDescriptionParts.length === 0).length
                        ));
                    }

                    const hasNoChanges = clientConsumersWithoutChanges > 0;
                    const noChangesText = hasNoChanges ? ` (+${clientConsumersWithoutChanges})` : '';
                    const newTotal = oldMeals + clientConsumersWithoutChanges;
                    const newTotalText = newTotal.toString();

                    const clientCodeText = item.clientCode;

                    // Render client name
                    doc.font('Roboto')
                        .fontSize(12)
                        .fillColor('black')
                        .text(clientCodeText, clientX, yPosition, {
                            lineBreak: false,
                            continued: true
                        });

                    const clientWidth = doc.widthOfString(clientCodeText);
                    let currentX = clientX + clientWidth + 5;

                    // Render old meals count (bold only if no changes)
                    doc.font(hasNoChanges ? 'Roboto' : 'Roboto-Bold')
                        .fontSize(12)
                        .text(oldMealsText, currentX, yPosition, {
                            lineBreak: false,
                            continued: hasNoChanges
                        });

                    if (hasNoChanges) {
                        const oldMealsWidth = doc.widthOfString(oldMealsText);
                        currentX += oldMealsWidth;

                        // Render (+no_changes)
                        doc.font('Roboto')
                            .fontSize(12)
                            .text(noChangesText, currentX, yPosition, {
                                lineBreak: false,
                                continued: true
                            });

                        const noChangesWidth = doc.widthOfString(noChangesText);
                        currentX += noChangesWidth + 5;

                        // Render new total (always bold)
                        doc.font('Roboto-Bold')
                            .fontSize(12)
                            .text(newTotalText, currentX, yPosition, {
                                lineBreak: false,
                                continued: false
                            });
                    }

                    yPosition += lineHeight;

                    if (noteText) {
                        doc.font('Roboto')
                            .fontSize(noteFontSize)
                            .fillColor('dimgray')
                            .text(noteText, clientX, yPosition, {
                                width: pageWidth - 10
                            });
                        yPosition += noteHeight;
                    }

                    yPosition += verticalGap;
                });

                // Add extra space between route groups
                yPosition += 15;
            });

            doc.y = yPosition; // Ustaw pozycję Y dla sekcji diet

            doc.x = 50;

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
            Object.entries(dietGroupedByRoute).forEach(([routeName, routeClients]) => {
                // Start each diet route on a new page, except the first one
                if (!isFirstDietRoute) {
                    doc.addPage();
                    doc.y = doc.page.margins.top;
                }
                isFirstDietRoute = false;

                // Calculate total consumers without changes for this route
                const routeTotalConsumersWithoutChanges = routeClients.reduce((routeSum, { mealsByMealName }) => {
                    const clientMaxConsumersWithoutChanges = Math.max(...Object.values(mealsByMealName).map(mealDetails =>
                        mealDetails.consumers.filter(diet => diet.dietDescriptionParts.length === 0).length
                    ));
                    return routeSum + (clientMaxConsumersWithoutChanges > 0 ? clientMaxConsumersWithoutChanges : 0);
                }, 0);
                const routeSuffix = routeTotalConsumersWithoutChanges > 0 ? ` (-${routeTotalConsumersWithoutChanges})` : '';

                // Route header for diets
                doc.moveDown()
                    .fontSize(14)
                    .font('Roboto-Bold')
                    .fillColor('black')
                    .text(`Trasa: ${routeName}${routeSuffix}`, 50);

                // Render clients for this route
                routeClients.forEach(({ clientCode, mealsByMealName }) => {
                    // Check space for client header + at least one diet item
                    const clientSpaceNeeded = 20 + 12 + 11; // 20 points for moveDown, 12 points for client fontSize, 11 points for diet item

                    if (doc.y + clientSpaceNeeded > doc.page.height - doc.page.margins.bottom - 30) {
                        doc.addPage();
                        doc.y = doc.page.margins.top;
                    }

                    // Calculate maximum number of consumers without changes across all meals for this client
                    const maxConsumersWithoutChanges = Math.max(...Object.values(mealsByMealName).map(mealDetails =>
                        mealDetails.consumers.filter(diet => diet.dietDescriptionParts.length === 0).length
                    ));
                    const clientSuffix = maxConsumersWithoutChanges > 0 ? ` (-${maxConsumersWithoutChanges})` : '';

                    doc.moveDown()
                        .fontSize(12)
                        .font('Roboto-Bold')
                        .text(`${clientCode}${clientSuffix}`, 70)
                        .font('Roboto');

                    Object.entries(mealsByMealName).forEach(([mealName, mealDetails]) => {
                        if (doc.y + 20 > doc.page.height - doc.page.margins.bottom - 30) {
                            doc.addPage();
                            doc.y = doc.page.margins.top;
                        }

                        // Count consumers without changes
                        const consumersWithoutChangesCount = mealDetails.consumers.filter(diet => diet.dietDescriptionParts.length === 0).length;
                        const countSuffix = consumersWithoutChangesCount > 0 ? ` -${consumersWithoutChangesCount}` : '';

                        doc.moveDown(0.5);
                        doc.fontSize(11).font('Roboto-Bold').text(`${mealName} (${mealDetails.baseFoodName})${countSuffix}`, 80);
                        doc.font('Roboto');

                        const consumersWithChanges = mealDetails.consumers.filter(diet => diet.dietDescriptionParts.length > 0);
                        const consumersWithoutChanges = mealDetails.consumers.filter(diet => diet.dietDescriptionParts.length === 0);

                        if (consumersWithChanges.length > 0) {
                            consumersWithChanges.forEach(diet => {
                                if (doc.y + 15 > doc.page.height - doc.page.margins.bottom - 30) {
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
                            if (doc.y + 15 > doc.page.height - doc.page.margins.bottom - 30) {
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
                });

                // Add space between route groups
                doc.moveDown();
            });

            const range = doc.bufferedPageRange();
            for (let i = range.start; i <= range.start + range.count - 1; i++) {
                doc.switchToPage(i);

                const currentY = doc.y;
                const originalMargins = { ...doc.page.margins };

                doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };

                doc.fontSize(10)
                    .font('Roboto')
                    .fillColor('black')
                    .text(
                        `${footerDate}     ${i + 1}/${range.count}     ${mealGroupName}`,
                        0,
                        doc.page.height - 30,
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