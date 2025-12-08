// import { db } from '@root/app/server/db';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { type MealGroup, RoleType } from '@prisma/client';
import translate from '@root/app/lib/lang/translate';
import { format } from 'date-fns-tz';
import { pl } from 'date-fns/locale';
import { getDict } from '@root/app/server/cache/translations';
import { getRoutesPdfValid } from '@root/app/validators/specific/order';
import safeFileName from '@root/app/lib/safeFileName';
import PDFDocument from 'pdfkit';
import { loadFonts } from '@root/app/lib/loadFonts';
import dayIdParser from '@root/app/server/api/routers/specific/libs/dayIdParser';
import returnPdfForFront from '@root/app/server/api/routers/specific/libs/pdf/returnPdfForFront';
import getDayOrders from '@root/app/server/api/routers/specific/libs/getDayOrders';
import groupStandardOrdersByDay, { type RouteStandardDetails } from '@root/app/server/api/routers/specific/libs/groupStandardOrdersByDay';
import getDayFoodData from '@root/app/server/api/routers/specific/libs/getDayFoodData';
import { type TransformedClientWithConsumersData, type TransformedRouteWithConsumersData } from '@root/app/server/api/routers/specific/libs/getGroupedConsumerFoodDataObject';
import logger from '@root/app/lib/logger';

const routesPdf = createCateringProcedure([RoleType.kitchen, RoleType.manager, RoleType.dietician])
    .input(getRoutesPdfValid)
    .query(async ({ input, ctx }) => {
        const { session: { catering, user } } = ctx;
        const { dayId, lang } = input;

        logger.info(`Generating Routes PDF | User: ${user.email} (${user.id}) | Day: ${dayId}`);

        // Parse date parts from dayId
        const { year, month, day } = dayIdParser(dayId);

        const dictionary = await getDict({ lang, keys: ['shared', 'orders'] });

        const translations = {
            breakfast: translate(dictionary, 'orders:breakfast'),
            lunch: translate(dictionary, 'orders:lunch'),
            dinner: translate(dictionary, 'orders:dinner'),
            client: translate(dictionary, 'orders:client_route_pdf'),
            total: translate(dictionary, 'orders:total_route_pdf'),
            routes: translate(dictionary, 'orders:routes_pdf_title'),
            unassigned: translate(dictionary, 'orders:no_route_pdf'),
            packaging: translate(dictionary, 'orders:packaging_route_pdf'),
        }

        const shortenLabel = (label: string, maxLength = 6): string => {
            if (label.length > maxLength) {
                return `${label.substring(0, maxLength - 1)}.`;
            }
            return label;
        };

        const currentDate = new Date(year, month, day);
        const formattedDate = format(currentDate, "eeee, dd MMMM yyyy", { locale: pl });
        const fileNameDate = format(currentDate, "yyyy-MM-dd", { locale: pl }); // Removed trailing space

        const dayData = await getDayOrders(dayId, catering.id);
        const groupedData: Record<string, RouteStandardDetails> = groupStandardOrdersByDay(dayData);
        const allMealsData = await getDayFoodData({ dayIds: [dayId], cateringId: catering.id });
        const allMealsDayData = allMealsData[dayId];

        const groupedDataByDeliveryRoute: Record<string, {
            meals: Record<string, { mealGroup: MealGroup, clients: Record<string, TransformedClientWithConsumersData>, changesCount: number, consumersWithoutChangesCount: number }>,
            routeData: TransformedRouteWithConsumersData,
        }> = {};
        Object.entries(allMealsDayData ?? {}).forEach(([mealGroupId, { mealGroup, routes }]) => {
            Object.entries(routes).forEach(([routeId, routeData]) => {
                const changesCount = Object.values(routeData?.clients ?? {}).reduce((acc, client) => acc + client.changesCount, 0);
                const consumersWithoutChangesCount = Object.values(routeData?.clients ?? {}).reduce((acc, client) => acc + client.consumersWithoutChangesCount, 0);
                if (!groupedDataByDeliveryRoute[routeId]) {
                    groupedDataByDeliveryRoute[routeId] = {
                        meals: {
                            [mealGroupId]: {
                                mealGroup,
                                clients: routeData?.clients ?? {},
                                changesCount,
                                consumersWithoutChangesCount
                            }
                        },
                        routeData: {
                            ...routeData,
                            changesCount,
                            consumersWithoutChangesCount
                        }
                    }
                } else {
                    groupedDataByDeliveryRoute[routeId].meals[mealGroupId] = {
                        mealGroup,
                        clients: routeData?.clients ?? {},
                        changesCount,
                        consumersWithoutChangesCount
                    };
                    groupedDataByDeliveryRoute[routeId].routeData = {
                        ...groupedDataByDeliveryRoute[routeId].routeData,
                        changesCount: groupedDataByDeliveryRoute[routeId].routeData.changesCount + changesCount,
                        consumersWithoutChangesCount: groupedDataByDeliveryRoute[routeId].routeData.consumersWithoutChangesCount + consumersWithoutChangesCount
                    };
                }
            });
        })

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

            const routeNames = Object.keys(groupedData).sort((a, b) => {
                // Handle "unassigned" route - always put it last
                if (a === "unassigned" && b !== "unassigned") return 1;
                if (b === "unassigned" && a !== "unassigned") return -1;
                // Regular alphabetical sort for other routes
                return a.localeCompare(b, 'pl');
            });

            if (routeNames.length === 0) {
                doc.font('Roboto').fontSize(16).text(translate(dictionary, 'orders:noRoutesFound') || "Nie znaleziono tras dla wybranego dnia.", { align: 'center' });
                doc.end();
                const fileName = safeFileName(`${translations.routes}_standard_${fileNameDate}.pdf`);
                const newPromise = new Promise<{ fileName: string; pdfPromise: Promise<Buffer> }>((resolve) => {
                    resolve({ fileName, pdfPromise });
                });
                return returnPdfForFront(newPromise);
            }

            const mmToPt = (mm: number) => mm * 2.83465;
            const clientColumnWidthFixed = mmToPt(35); // 3.5cm for client code
            const packagingColumnWidth = mmToPt(25); // Approx 2.5cm for packaging

            for (let i = 0; i < routeNames.length; i++) {
                const routeName = routeNames[i]!; // routeName is guaranteed to be a string key
                const routeDetails = groupedData[routeName]!;
                const { routeData, meals } = Object.values(groupedDataByDeliveryRoute).find((route) => route.routeData.deliveryRouteName === routeName)!;

                if (i > 0) {
                    doc.addPage();
                }

                // Page Header
                doc.font('Roboto-Bold').fontSize(16).text(routeName === "unassigned" ? translations.unassigned : routeName, { align: 'center' });
                doc.font('Roboto').fontSize(12).text(formattedDate, { align: 'center' });
                doc.moveDown(2);

                // Table data
                let tableTopY = doc.y;
                const headerFontSize = 10;
                const cellFontSize = 9;
                const baseRowPaddingY = 4;
                let rowHeight = cellFontSize + (2 * baseRowPaddingY) + 2;
                rowHeight *= 1.5; // Increase row height by 1.5 times
                const actualTextPaddingY = (rowHeight - cellFontSize - 2) / 2; // Recalculate padding for centering text vertically

                const pageContentLeft = doc.page.margins.left;
                const pageContentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

                const cellHorizontalPadding = mmToPt(1.5); // Approx 1.5mm padding on the left for meal counts

                const remainingWidthForMealsAndTotal = pageContentWidth - clientColumnWidthFixed - packagingColumnWidth;
                // Now 4 columns (B, L, D, Total) will share this remaining width
                const mealAndTotalColumnWidth = remainingWidthForMealsAndTotal / 4;

                const columnWidths = {
                    client: clientColumnWidthFixed,
                    breakfast: mealAndTotalColumnWidth,
                    lunch: mealAndTotalColumnWidth,
                    dinner: mealAndTotalColumnWidth,
                    total: mealAndTotalColumnWidth,
                    packaging: packagingColumnWidth,
                };

                const drawVerticalLines = (yPosition: number, height: number) => {
                    let currentX = pageContentLeft;
                    doc.lineWidth(0.25).strokeColor('grey');

                    currentX += columnWidths.client;
                    doc.moveTo(currentX, yPosition).lineTo(currentX, yPosition + height).stroke();

                    currentX += columnWidths.breakfast;
                    doc.moveTo(currentX, yPosition).lineTo(currentX, yPosition + height).stroke();

                    currentX += columnWidths.lunch;
                    doc.moveTo(currentX, yPosition).lineTo(currentX, yPosition + height).stroke();

                    currentX += columnWidths.dinner;
                    doc.moveTo(currentX, yPosition).lineTo(currentX, yPosition + height).stroke();

                    currentX += columnWidths.total;
                    doc.moveTo(currentX, yPosition).lineTo(currentX, yPosition + height).stroke();

                    // No line after the last column (packaging)
                    doc.strokeColor('black'); // Reset stroke color
                };

                // Table Header
                doc.font('Roboto-Bold').fontSize(headerFontSize);
                let xPos = pageContentLeft;
                doc.text(translations.client, xPos + cellHorizontalPadding, tableTopY + actualTextPaddingY, { width: columnWidths.client - cellHorizontalPadding, lineBreak: false, ellipsis: true });
                xPos += columnWidths.client;
                doc.text(shortenLabel(translations.breakfast, 15), xPos + cellHorizontalPadding, tableTopY + actualTextPaddingY, { width: columnWidths.breakfast - cellHorizontalPadding, align: 'left' });
                xPos += columnWidths.breakfast;
                doc.text(shortenLabel(translations.lunch, 15), xPos + cellHorizontalPadding, tableTopY + actualTextPaddingY, { width: columnWidths.lunch - cellHorizontalPadding, align: 'left' });
                xPos += columnWidths.lunch;
                doc.text(shortenLabel(translations.dinner, 9), xPos + cellHorizontalPadding, tableTopY + actualTextPaddingY, { width: columnWidths.dinner - cellHorizontalPadding, align: 'left' });
                xPos += columnWidths.dinner;
                doc.text(shortenLabel(translations.total, 15), xPos + cellHorizontalPadding, tableTopY + actualTextPaddingY, { width: columnWidths.total - cellHorizontalPadding, align: 'left' });
                xPos += columnWidths.total;
                doc.text(shortenLabel(translations.packaging, 15), xPos + cellHorizontalPadding, tableTopY + actualTextPaddingY, { width: columnWidths.packaging - cellHorizontalPadding, align: 'left' });

                // Draw vertical lines for header
                drawVerticalLines(tableTopY, rowHeight);

                // Move Y position down by the calculated height of the header row
                tableTopY += rowHeight;
                doc.lineWidth(0.5).moveTo(pageContentLeft, tableTopY).lineTo(pageContentLeft + pageContentWidth, tableTopY).stroke();

                let currentY = tableTopY; // Start rows after the header line
                doc.font('Roboto').fontSize(cellFontSize);

                const breakfastConsumersWithoutChangesCount = meals.breakfast?.consumersWithoutChangesCount ?? 0;
                const lunchConsumersWithoutChangesCount = meals.lunch?.consumersWithoutChangesCount ?? 0;
                const dinnerConsumersWithoutChangesCount = meals.dinner?.consumersWithoutChangesCount ?? 0;

                // Sort clients alphabetically by clientCode and filter out clients with zero total meals
                const sortedClients = [...routeDetails.clients]
                    .filter(client => {
                        const clientBreakfastConsumersWithoutChangesCount = meals.breakfast?.clients[client.clientId]?.consumersWithoutChangesCount ?? 0;
                        const clientDinnerConsumersWithoutChangesCount = meals.dinner?.clients[client.clientId]?.consumersWithoutChangesCount ?? 0;
                        const clientLunchConsumersWithoutChangesCount = meals.lunch?.clients[client.clientId]?.consumersWithoutChangesCount ?? 0;
                        const clientTotalConsumersWithoutChangesCount = clientBreakfastConsumersWithoutChangesCount + clientDinnerConsumersWithoutChangesCount + clientLunchConsumersWithoutChangesCount;
                        const totalMealsIncludingConsumersWithoutChanges = client.totalClientMeals + clientTotalConsumersWithoutChangesCount;

                        // Filter out clients with 0, null, or undefined total meals
                        return totalMealsIncludingConsumersWithoutChanges > 0;
                    })
                    .sort((a, b) => a.clientCode.localeCompare(b.clientCode, 'pl'));

                for (const clientData of sortedClients) {

                    if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom - 30) { // -30 for footer
                        doc.addPage();
                        currentY = doc.page.margins.top;
                        // Redraw header on new page if table splits
                        doc.font('Roboto-Bold').fontSize(16).text(routeName === "unassigned" ? translations.unassigned : routeName, { align: 'center' });
                        doc.font('Roboto').fontSize(12).text(formattedDate, { align: 'center' });
                        doc.moveDown(2);

                        tableTopY = doc.y;
                        xPos = pageContentLeft;
                        doc.font('Roboto-Bold').fontSize(headerFontSize);
                        doc.text(translations.client, xPos + cellHorizontalPadding, tableTopY + actualTextPaddingY, { width: columnWidths.client - cellHorizontalPadding, lineBreak: false, ellipsis: true });
                        xPos += columnWidths.client;
                        doc.text(shortenLabel(translations.breakfast), xPos + cellHorizontalPadding, tableTopY + actualTextPaddingY, { width: columnWidths.breakfast - cellHorizontalPadding, align: 'left' });
                        xPos += columnWidths.breakfast;
                        doc.text(shortenLabel(translations.lunch), xPos + cellHorizontalPadding, tableTopY + actualTextPaddingY, { width: columnWidths.lunch - cellHorizontalPadding, align: 'left' });
                        xPos += columnWidths.lunch;
                        doc.text(shortenLabel(translations.dinner), xPos + cellHorizontalPadding, tableTopY + actualTextPaddingY, { width: columnWidths.dinner - cellHorizontalPadding, align: 'left' });
                        xPos += columnWidths.dinner;
                        doc.text(shortenLabel(translations.total), xPos + cellHorizontalPadding, tableTopY + actualTextPaddingY, { width: columnWidths.total - cellHorizontalPadding, align: 'left' });
                        xPos += columnWidths.total;
                        doc.text(shortenLabel(translations.packaging), xPos + cellHorizontalPadding, tableTopY + actualTextPaddingY, { width: columnWidths.packaging - cellHorizontalPadding, align: 'left' });

                        // Draw vertical lines for re-drawn header
                        drawVerticalLines(tableTopY, rowHeight);

                        tableTopY += rowHeight;
                        doc.lineWidth(0.5).moveTo(pageContentLeft, tableTopY).lineTo(pageContentLeft + pageContentWidth, tableTopY).stroke();
                        currentY = tableTopY;
                        doc.font('Roboto').fontSize(cellFontSize);
                    }

                    const clientDisplayText = clientData.clientCode;
                    const clientBreakfastConsumersWithoutChangesCount = meals.breakfast?.clients[clientData.clientId]?.consumersWithoutChangesCount ?? 0;
                    const clientDinnerConsumersWithoutChangesCount = meals.dinner?.clients[clientData.clientId]?.consumersWithoutChangesCount ?? 0;
                    const clientLunchConsumersWithoutChangesCount = meals.lunch?.clients[clientData.clientId]?.consumersWithoutChangesCount ?? 0;
                    const clientTotalConsumersWithoutChangesCount = clientBreakfastConsumersWithoutChangesCount + clientDinnerConsumersWithoutChangesCount + clientLunchConsumersWithoutChangesCount;

                    xPos = pageContentLeft;
                    doc.text(clientDisplayText, xPos + cellHorizontalPadding, currentY + actualTextPaddingY, { width: columnWidths.client - cellHorizontalPadding, lineBreak: false, ellipsis: true });
                    xPos += columnWidths.client;

                    // Breakfast cell
                    if (clientBreakfastConsumersWithoutChangesCount > 0) {
                        const originalBreakfast = clientData.breakfast;
                        const finalBreakfast = originalBreakfast + clientBreakfastConsumersWithoutChangesCount;

                        doc.text(originalBreakfast.toString(), xPos + cellHorizontalPadding, currentY + actualTextPaddingY, {
                            width: columnWidths.breakfast - cellHorizontalPadding,
                            align: 'left',
                            continued: true
                        });
                        doc.text(` (+${clientBreakfastConsumersWithoutChangesCount})`, { continued: true });
                        doc.font('Roboto-Bold').text(` ${finalBreakfast}`).font('Roboto');
                    } else {
                        doc.font('Roboto-Bold').text(clientData.breakfast.toString(), xPos + cellHorizontalPadding, currentY + actualTextPaddingY, { width: columnWidths.breakfast - cellHorizontalPadding, align: 'left' }).font('Roboto');
                    }
                    xPos += columnWidths.breakfast;

                    // Lunch cell
                    if (clientLunchConsumersWithoutChangesCount > 0) {
                        const originalLunch = clientData.lunch;
                        const finalLunch = originalLunch + clientLunchConsumersWithoutChangesCount;

                        doc.text(originalLunch.toString(), xPos + cellHorizontalPadding, currentY + actualTextPaddingY, {
                            width: columnWidths.lunch - cellHorizontalPadding,
                            align: 'left',
                            continued: true
                        });
                        doc.text(` (+${clientLunchConsumersWithoutChangesCount})`, { continued: true });
                        doc.font('Roboto-Bold').text(` ${finalLunch}`).font('Roboto');
                    } else {
                        doc.font('Roboto-Bold').text(clientData.lunch.toString(), xPos + cellHorizontalPadding, currentY + actualTextPaddingY, { width: columnWidths.lunch - cellHorizontalPadding, align: 'left' }).font('Roboto');
                    }
                    xPos += columnWidths.lunch;

                    // Dinner cell
                    if (clientDinnerConsumersWithoutChangesCount > 0) {
                        const originalDinner = clientData.dinner;
                        const finalDinner = originalDinner + clientDinnerConsumersWithoutChangesCount;

                        doc.text(originalDinner.toString(), xPos + cellHorizontalPadding, currentY + actualTextPaddingY, {
                            width: columnWidths.dinner - cellHorizontalPadding,
                            align: 'left',
                            continued: true
                        });
                        doc.text(` (+${clientDinnerConsumersWithoutChangesCount})`, { continued: true });
                        doc.font('Roboto-Bold').text(` ${finalDinner}`).font('Roboto');
                    } else {
                        doc.font('Roboto-Bold').text(clientData.dinner.toString(), xPos + cellHorizontalPadding, currentY + actualTextPaddingY, { width: columnWidths.dinner - cellHorizontalPadding, align: 'left' }).font('Roboto');
                    }
                    xPos += columnWidths.dinner;

                    // Total cell for client
                    if (clientTotalConsumersWithoutChangesCount > 0) {
                        const originalTotal = clientData.totalClientMeals;
                        const finalTotal = originalTotal + clientTotalConsumersWithoutChangesCount;

                        doc.font('Roboto').text(originalTotal.toString(), xPos + cellHorizontalPadding, currentY + actualTextPaddingY, {
                            width: columnWidths.total - cellHorizontalPadding,
                            align: 'left',
                            continued: true
                        });
                        doc.text(` (+${clientTotalConsumersWithoutChangesCount})`, { continued: true });
                        doc.font('Roboto-Bold').text(` ${finalTotal}`).font('Roboto');
                    } else {
                        doc.font('Roboto-Bold').text(clientData.totalClientMeals.toString(), xPos + cellHorizontalPadding, currentY + actualTextPaddingY, { width: columnWidths.total - cellHorizontalPadding, align: 'left' }).font('Roboto');
                    }
                    xPos += columnWidths.total;
                    // Empty cell for packaging
                    doc.text("", xPos + cellHorizontalPadding, currentY + actualTextPaddingY, { width: columnWidths.packaging - cellHorizontalPadding, align: 'left' });

                    // Draw vertical lines for this client row
                    drawVerticalLines(currentY, rowHeight);

                    currentY += rowHeight;
                    doc.lineWidth(0.25).moveTo(pageContentLeft, currentY).lineTo(pageContentLeft + pageContentWidth, currentY).strokeColor('grey').stroke();
                    doc.strokeColor('black');
                }

                if (routeDetails.clients.length === 0) {
                    currentY += rowHeight / 2;
                }



                // Totals Row
                doc.font('Roboto-Bold').fontSize(headerFontSize);
                xPos = pageContentLeft;
                doc.text(translations.total.toUpperCase(), xPos + cellHorizontalPadding, currentY + actualTextPaddingY, { width: columnWidths.client - cellHorizontalPadding });
                xPos += columnWidths.client;

                // Breakfast total
                if (breakfastConsumersWithoutChangesCount > 0) {
                    const originalBreakfast = routeDetails.totalBreakfast;
                    const finalBreakfast = originalBreakfast + breakfastConsumersWithoutChangesCount;

                    doc.font('Roboto').text(originalBreakfast.toString(), xPos + cellHorizontalPadding, currentY + actualTextPaddingY, {
                        width: columnWidths.breakfast - cellHorizontalPadding,
                        align: 'left',
                        continued: true
                    });
                    doc.text(` (+${breakfastConsumersWithoutChangesCount})`, { continued: true });
                    doc.font('Roboto-Bold').text(` ${finalBreakfast}`);
                } else {
                    doc.text(routeDetails.totalBreakfast.toString(), xPos + cellHorizontalPadding, currentY + actualTextPaddingY, { width: columnWidths.breakfast - cellHorizontalPadding, align: 'left' });
                }
                xPos += columnWidths.breakfast;

                // Lunch total
                if (lunchConsumersWithoutChangesCount > 0) {
                    const originalLunch = routeDetails.totalLunch;
                    const finalLunch = originalLunch + lunchConsumersWithoutChangesCount;

                    doc.font('Roboto').text(originalLunch.toString(), xPos + cellHorizontalPadding, currentY + actualTextPaddingY, {
                        width: columnWidths.lunch - cellHorizontalPadding,
                        align: 'left',
                        continued: true
                    });
                    doc.text(` (+${lunchConsumersWithoutChangesCount})`, { continued: true });
                    doc.font('Roboto-Bold').text(` ${finalLunch}`);
                } else {
                    doc.text(routeDetails.totalLunch.toString(), xPos + cellHorizontalPadding, currentY + actualTextPaddingY, { width: columnWidths.lunch - cellHorizontalPadding, align: 'left' });
                }
                xPos += columnWidths.lunch;

                // Dinner total
                if (dinnerConsumersWithoutChangesCount > 0) {
                    const originalDinner = routeDetails.totalDinner;
                    const finalDinner = originalDinner + dinnerConsumersWithoutChangesCount;

                    doc.font('Roboto').text(originalDinner.toString(), xPos + cellHorizontalPadding, currentY + actualTextPaddingY, {
                        width: columnWidths.dinner - cellHorizontalPadding,
                        align: 'left',
                        continued: true
                    });
                    doc.text(` (+${dinnerConsumersWithoutChangesCount})`, { continued: true });
                    doc.font('Roboto-Bold').text(` ${finalDinner}`);
                } else {
                    doc.text(routeDetails.totalDinner.toString(), xPos + cellHorizontalPadding, currentY + actualTextPaddingY, { width: columnWidths.dinner - cellHorizontalPadding, align: 'left' });
                }
                xPos += columnWidths.dinner;

                // Handle total column with consumersWithoutChangesCount logic
                const consumersWithoutChangesCount = routeData.consumersWithoutChangesCount || 0;
                if (consumersWithoutChangesCount > 0) {
                    const originalTotal = routeDetails.totalRouteMeals;
                    const finalTotal = originalTotal + consumersWithoutChangesCount;

                    // First write the original total (not bold)
                    doc.font('Roboto').text(originalTotal.toString(), xPos + cellHorizontalPadding, currentY + actualTextPaddingY, {
                        width: columnWidths.total - cellHorizontalPadding,
                        align: 'left',
                        continued: true
                    });

                    // Add the consumersWithoutChangesCount in parentheses (not bold)
                    doc.text(` (+${consumersWithoutChangesCount})`, { continued: true });

                    // Add the final total (bold)
                    doc.font('Roboto-Bold').text(` ${finalTotal}`);
                } else {
                    doc.text(routeDetails.totalRouteMeals.toString(), xPos + cellHorizontalPadding, currentY + actualTextPaddingY, { width: columnWidths.total - cellHorizontalPadding, align: 'left' });
                }
                xPos += columnWidths.total;
                // Empty cell for packaging in total row
                doc.text("", xPos + cellHorizontalPadding, currentY + actualTextPaddingY, { width: columnWidths.packaging - cellHorizontalPadding, align: 'left' });

                // Draw vertical lines for the total row
                drawVerticalLines(currentY, rowHeight);
            }

            // Add footer to every page
            const range = doc.bufferedPageRange();
            for (let pageNum = range.start; pageNum < range.start + range.count; pageNum++) { // Use pageNum for clarity
                doc.switchToPage(pageNum);

                const originalY = doc.y;
                const originalMargins = { ...doc.page.margins };

                doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };

                doc.fontSize(10)
                    .font('Roboto')
                    .text(
                        `${translations.routes} - ${format(currentDate, "dd-MM-yyyy")} - ${translate(dictionary, 'shared:page_only')} ${pageNum + 1} / ${range.count}`,
                        0,
                        doc.page.height - 30,
                        {
                            align: 'center',
                            width: doc.page.width,
                        }
                    );

                doc.page.margins = originalMargins; // Restore margins
                doc.y = originalY; // Restore Y
            }

            doc.end();
            const fileName = safeFileName(`${translations.routes}_standard_${fileNameDate}.pdf`);
            const newPromise = new Promise<{ fileName: string; pdfPromise: Promise<Buffer> }>((resolve) => {
                resolve({ fileName, pdfPromise });
            });
            return returnPdfForFront(newPromise);

        } catch (error) {
            logger.error(`Error generating Routes PDF | User: ${ctx.session.user.email} | Error: ${error}`);
            throw error;
        }
    });

export default routesPdf;
