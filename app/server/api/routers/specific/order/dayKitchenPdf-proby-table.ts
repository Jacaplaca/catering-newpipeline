import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { type Consumer, RoleType, type Diet } from '@prisma/client';
import { getDayKitchenPdfValid } from '@root/app/validators/specific/order';
import getDayFoodData from '@root/app/server/api/routers/specific/libs/getDayFoodData';
import translate from '@root/app/lib/lang/translate';
import { format } from 'date-fns-tz';
import { pl } from 'date-fns/locale';
import { getDict } from '@root/app/server/cache/translations';
import safeFileName from '@root/app/lib/safeFileName';
import PDFDocument from 'pdfkit';
import { loadFonts } from '@root/app/lib/loadFonts';
import dayIdParser from '@root/app/server/api/routers/specific/libs/dayIdParser';
import returnPdfForFront from '@root/app/server/api/routers/specific/libs/pdf/returnPdfForFront';
import { db } from '@root/app/server/db';
import { type TransformedConsumerData } from '@root/app/server/api/routers/specific/libs/getGroupedConsumerFoodDataObject';

const dayKitchenPdf = createCateringProcedure([RoleType.kitchen, RoleType.manager, RoleType.dietician])
    .input(getDayKitchenPdfValid)
    .query(async ({ input, ctx }) => {
        const { session: { catering } } = ctx;
        const { dayId, lang } = input;

        const meal2data = await getDayFoodData({ dayId, cateringId: catering.id });

        if (!meal2data || Object.keys(meal2data).length === 0) {
            throw new Error('No meal data found for the given day');
        }

        const consumerIds: string[] = [];
        if (meal2data) {
            for (const mealName in meal2data) {
                const routes = meal2data[mealName];
                if (!routes) continue;
                for (const routeId in routes) {
                    const route = routes[routeId];
                    if (!route?.clients) continue;
                    for (const clientId in route.clients) {
                        const client = route.clients[clientId];
                        if (!client?.consumers) continue;
                        consumerIds.push(...Object.keys(client.consumers));
                    }
                }
            }
        }
        const uniqueConsumerIds = [...new Set(consumerIds)];

        const consumersWithDiets = await db.consumer.findMany({
            where: {
                id: {
                    in: uniqueConsumerIds
                }
            }
        });
        const consumersWithDietsMap = new Map(consumersWithDiets.map(c => [c.id, c]));

        if (meal2data) {
            for (const mealName in meal2data) {
                const routes = meal2data[mealName];
                if (!routes) continue;
                for (const routeId in routes) {
                    const route = routes[routeId];
                    if (!route?.clients) continue;
                    for (const clientId in route.clients) {
                        const client = route.clients[clientId];
                        if (!client?.consumers) continue;
                        for (const consumerId in client.consumers) {
                            const consumerData = client.consumers[consumerId];
                            if (consumerData) {
                                const consumerWithDiet = consumersWithDietsMap.get(consumerData.consumer.id);
                                if (consumerWithDiet) {
                                    consumerData.consumer = {
                                        ...consumerData.consumer,
                                        ...consumerWithDiet
                                    };
                                }
                            }
                        }
                    }
                }
            }
        }

        // Process meal2data similar to DietNew.tsx logic
        const allMealNames = [...new Set(Object.keys(meal2data))];

        const clients: Record<string, {
            clientInfo: {
                clientCode: string;
                clientId: string;
            },
            meals: Record<string, {
                consumers: Array<TransformedConsumerData & {
                    consumer: Consumer & { diet: Diet | null }
                }>
            }>
        }> = {};

        // Transform meal2data into clients structure similar to DietNew.tsx
        for (const mealName of allMealNames) {
            const routes = meal2data[mealName];
            if (!routes) continue;

            for (const route of Object.values(routes)) {
                for (const client of Object.values(route.clients)) {
                    const clientCode = client.clientCode;
                    if (!clients[clientCode]) {
                        clients[clientCode] = {
                            clientInfo: {
                                clientCode: client.clientCode,
                                clientId: client.clientId,
                            },
                            meals: {}
                        };
                    }

                    if (!clients[clientCode].meals[mealName]) {
                        clients[clientCode].meals[mealName] = { consumers: [] };
                    }

                    const existingConsumerIds = new Set(clients[clientCode].meals[mealName]?.consumers.map(c => c.consumer._id));

                    for (const consumerData of Object.values(client.consumers)) {
                        if (!existingConsumerIds.has(consumerData.consumer._id)) {
                            const relevantMealsForConsumer = Object.values(consumerData.meals)
                            // .filter(mealDetails => mealDetails.meal.name === mealName);

                            if (relevantMealsForConsumer.length > 0) {
                                const newConsumerData = {
                                    ...consumerData,
                                    meals: Object.fromEntries(relevantMealsForConsumer.map(m => [m.meal._id, m]))
                                }
                                clients[clientCode].meals[mealName]?.consumers.push(newConsumerData);
                                existingConsumerIds.add(consumerData.consumer._id);
                            }
                        }
                    }
                }
            }
        }

        const clientRowsData = Object.values(clients);
        const dictionary = await getDict({ lang, keys: ['shared', 'orders'] });
        const { year, month, day } = dayIdParser(dayId);
        const deliveryDayDate = new Date(year, month, day);

        const headDate = format(deliveryDayDate, "EEEE d MMM yyyy ", { locale: pl });
        const footerDate = format(deliveryDayDate, "d-MM-yyyy ", { locale: pl });
        const fileNameDate = format(deliveryDayDate, "yyyy-MM-dd ", { locale: pl });

        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 35, // Zmniejszone o 30% z 50 na 35
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
            doc.registerFont('Roboto-Italic', fonts.italic);
            doc.registerFont('Roboto-BoldItalic', fonts.boldItalic);

            // Header
            doc.font('Roboto-Bold')
                .fontSize(20)
                .text(translate(dictionary, 'orders:diet'), { align: 'center' });

            doc.moveDown();
            doc.fontSize(16)
                .text(`${headDate}`, { align: 'center' });

            doc.moveDown(2);

            const pageWidth = doc.page.width - 70; // margin left 35 + margin right 35
            const lineHeight = 14; // Zwiększyłem wysokość linii dla lepszej czytelności
            const clientCodeWidth = 50; // Zmniejszone 2-krotnie z 100 na 50
            const columnPadding = 10; // Dodałem padding między kolumnami
            const totalColumnsWidth = pageWidth - clientCodeWidth - (columnPadding * allMealNames.length);
            const mealColumnWidth = totalColumnsWidth / allMealNames.length;

            let yPosition = doc.y + 20;

            const drawPageHeaders = (y: number) => {
                doc.font('Roboto-Bold')
                    .fontSize(12)
                    .fillColor('black');
                doc.text(translate(dictionary, 'orders:client_name_column'), 35, y, {
                    width: clientCodeWidth,
                    align: 'left'
                });
                allMealNames.forEach((mealName, index) => {
                    const xPosition = 35 + clientCodeWidth + columnPadding + (index * (mealColumnWidth + columnPadding));
                    doc.text(mealName, xPosition, y, {
                        width: mealColumnWidth,
                        align: 'center'
                    });
                });
                y += lineHeight + 10;
                doc.strokeColor('black')
                    .lineWidth(1)
                    .moveTo(35, y)
                    .lineTo(35 + pageWidth, y)
                    .stroke();
                return y + 10;
            };

            yPosition = drawPageHeaders(yPosition - 10);


            // Render client rows
            for (const { clientInfo, meals } of clientRowsData) {
                const hasOrders = meals && allMealNames.some(mealName => {
                    const meal = meals[mealName];
                    return meal?.consumers?.length ?? 0 > 0;
                });

                if (!hasOrders) continue;

                const allConsumersInClient = new Map<string, TransformedConsumerData>();
                Object.values(meals).forEach(meal => {
                    meal.consumers.forEach(consumer => {
                        if (!allConsumersInClient.has(consumer.consumer._id)) {
                            allConsumersInClient.set(consumer.consumer._id, consumer);
                        }
                    });
                });

                const sortedConsumers = Array.from(allConsumersInClient.values()).sort((a, b) => {
                    const codeA = a.consumer.code ?? 'UNKNOWN';
                    const codeB = b.consumer.code ?? 'UNKNOWN';
                    return codeA.localeCompare(codeB, 'pl', { sensitivity: 'base' });
                });


                const getConsumerHeightInMeal = (consumer: TransformedConsumerData) => {
                    let height = lineHeight; // Consumer header line
                    Object.values(consumer.meals).forEach(mealItem => {
                        mealItem.consumerFoods.forEach(foodItem => {
                            let foodText = foodItem.alternativeFood ? `${foodItem.food.name} -> ${foodItem.alternativeFood.name}` : foodItem.food.name;
                            if (foodItem.exclusions.length > 0) foodText += ` (${foodItem.exclusions.map(e => e.name).join(', ')})`;
                            if (foodItem.comment) foodText += ` [${foodItem.comment}]`;

                            doc.font('Roboto').fontSize(9);
                            const textHeight = doc.heightOfString(`• ${foodText}`, { width: mealColumnWidth - 15 });
                            height += Math.max(textHeight, 12);
                        });
                    });
                    height += 5; // Space between consumers
                    return height;
                };


                let isFirstChunkForClient = true;
                const consumerQueue = [...sortedConsumers];

                while (consumerQueue.length > 0) {
                    const currentChunkConsumers: TransformedConsumerData[] = [];
                    let chunkMealHeights = allMealNames.map(() => 0);


                    for (const consumer of consumerQueue) {
                        if (!consumer) continue;

                        const tempChunkMealHeights = [...chunkMealHeights];
                        let consumerAdded = false;

                        allMealNames.forEach((mealName, mealIndex) => {
                            const mealData = meals[mealName];
                            if (mealData?.consumers.some(c => c.consumer?._id === consumer.consumer?._id)) {
                                const currentHeight = tempChunkMealHeights[mealIndex];
                                if (currentHeight !== undefined) {
                                    tempChunkMealHeights[mealIndex] = currentHeight + getConsumerHeightInMeal(consumer);
                                }
                                consumerAdded = true;
                            }
                        });


                        if (consumerAdded) {
                            const maxChunkHeight = Math.max(...tempChunkMealHeights);

                            if (yPosition + maxChunkHeight > doc.page.height - doc.page.margins.bottom - 30 && currentChunkConsumers.length > 0) {
                                break;
                            }
                            currentChunkConsumers.push(consumer);
                            chunkMealHeights = tempChunkMealHeights;

                        }
                    }

                    consumerQueue.splice(0, currentChunkConsumers.length);

                    const maxRowHeight = Math.max(...chunkMealHeights);

                    if (yPosition + maxRowHeight > doc.page.height - doc.page.margins.bottom - 30) {
                        doc.addPage();
                        yPosition = doc.page.margins.top;
                        yPosition = drawPageHeaders(yPosition);
                    }

                    const actualRowStartY = yPosition;

                    if (isFirstChunkForClient) {
                        doc.font('Roboto-Bold').fontSize(12).fillColor('black')
                            .text(clientInfo.clientCode, 35, yPosition, {
                                width: clientCodeWidth,
                                align: 'left'
                            });
                    }


                    allMealNames.forEach((mealName, index) => {
                        const mealData = meals[mealName];
                        const xPosition = 35 + clientCodeWidth + columnPadding + (index * (mealColumnWidth + columnPadding));

                        if (mealData) {
                            let mealYPosition = actualRowStartY;
                            const consumersToRender = mealData.consumers
                                .filter(c => currentChunkConsumers.some(chunkConsumer => chunkConsumer.consumer._id === c.consumer._id))
                                .sort((a, b) => {
                                    const codeA = a.consumer.code ?? 'UNKNOWN';
                                    const codeB = b.consumer.code ?? 'UNKNOWN';
                                    return codeA.localeCompare(codeB, 'pl', { sensitivity: 'base' });
                                });


                            consumersToRender.forEach((consumer) => {
                                const diet = consumer.consumer.diet;
                                const originalConsumerCode = consumer.consumer.code ?? 'UNKNOWN';

                                let cleanConsumerCode = originalConsumerCode;
                                const clientCode = clientInfo.clientCode;
                                if (originalConsumerCode.startsWith(clientCode + ' ')) {
                                    cleanConsumerCode = originalConsumerCode.substring(clientCode.length + 1);
                                }

                                let consumerText = `${cleanConsumerCode}`;
                                if (diet?.code) {
                                    consumerText += `: ${diet.code}`;
                                }

                                doc.font('Roboto-Bold').fontSize(10).fillColor('black')
                                    .text(consumerText, xPosition + 5, mealYPosition, {
                                        width: mealColumnWidth - 10,
                                        align: 'left'
                                    });

                                mealYPosition += lineHeight;


                                Object.values(consumer.meals).forEach(mealItem => {
                                    mealItem.consumerFoods.forEach(foodItem => {
                                        let foodText = '';

                                        if (foodItem.alternativeFood) {
                                            foodText = `${foodItem.food.name} -> ${foodItem.alternativeFood.name}`;
                                        } else {
                                            foodText = foodItem.food.name;
                                        }

                                        if (foodItem.exclusions.length > 0) {
                                            foodText += ` (${foodItem.exclusions.map(e => e.name).join(', ')})`;
                                        }

                                        if (foodItem.comment) {
                                            foodText += ` [${foodItem.comment}]`;
                                        }
                                        const parseText = (text: string) => {
                                            const altFoodMatch = text.match(/^(.+?)\s*->\s*(.+?)(\s*\([^)]+\))?\s*(\s*\[.+?\])?$/);
                                            if (altFoodMatch) {
                                                return {
                                                    mainText: altFoodMatch[1]?.trim() ?? '',
                                                    alternativeFood: altFoodMatch[2]?.trim() ?? '',
                                                    exclusions: altFoodMatch[3]?.trim() ?? '',
                                                    comment: altFoodMatch[4]?.trim() ?? ''
                                                };
                                            }
                                            const normalMatch = text.match(/^(.+?)(\s*\([^)]+\))?\s*(\s*\[.+?\])?$/);
                                            return {
                                                mainText: normalMatch?.[1]?.trim() ?? text,
                                                alternativeFood: '',
                                                exclusions: normalMatch?.[2]?.trim() ?? '',
                                                comment: normalMatch?.[3]?.trim() ?? ''
                                            };
                                        };

                                        const { mainText, alternativeFood, exclusions, comment } = parseText(foodText);

                                        doc.font('Roboto').fontSize(9);
                                        const actualTextHeight = doc.heightOfString(`• ${foodText}`, {
                                            width: mealColumnWidth - 15
                                        });

                                        doc.font('Roboto').fontSize(9).fillColor('#444444')
                                            .text(`• ${mainText}`, xPosition + 10, mealYPosition, {
                                                width: mealColumnWidth - 15,
                                                align: 'left',
                                                continued: !!alternativeFood || !!exclusions || !!comment
                                            });

                                        if (alternativeFood) {
                                            doc.font('Roboto-Italic').fillColor('#000000')
                                                .text(` -> ${alternativeFood}`, {
                                                    continued: !!exclusions || !!comment
                                                });
                                        }

                                        if (exclusions) {
                                            doc.font('Roboto-BoldItalic').fillColor('#000000')
                                                .text(` ${exclusions}`, {
                                                    continued: !!comment
                                                });
                                        }

                                        if (comment) {
                                            doc.font('Roboto-Bold').fillColor('#000000')
                                                .text(` ${comment}`, {
                                                    continued: false
                                                });
                                        }

                                        const minHeight = 12;
                                        mealYPosition += Math.max(actualTextHeight, minHeight);
                                    });
                                });

                                mealYPosition += 5;
                            });
                        }
                    });

                    yPosition = actualRowStartY + maxRowHeight + 10;

                    doc.strokeColor('lightgray').lineWidth(0.5)
                        .moveTo(35, yPosition)
                        .lineTo(35 + pageWidth, yPosition)
                        .stroke();

                    yPosition += 10;
                    isFirstChunkForClient = false;
                }
            }

            // Add page numbers
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
                        `${footerDate}     ${i + 1}/${range.count}     ${translate(dictionary, 'orders:diet')}`,
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

            const fileName = `${translate(dictionary, 'orders:diet')}_${fileNameDate}.pdf`;
            return returnPdfForFront({ pdfPromise, fileName: safeFileName(fileName) });

        } catch (error) {
            console.error('Błąd podczas generowania PDF:', error);
            throw error;
        }
    });

export default dayKitchenPdf;