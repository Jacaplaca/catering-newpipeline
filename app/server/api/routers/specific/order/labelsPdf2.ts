// import { db } from '@root/app/server/db';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { RoleType } from '@prisma/client';
import { format } from 'date-fns-tz';
import { pl } from 'date-fns/locale';
import { getOrdersPdf2Valid } from '@root/app/validators/specific/order';
import safeFileName from '@root/app/lib/safeFileName';
import PDFDocument from 'pdfkit';
import { loadFonts } from '@root/app/lib/loadFonts';
import dayIdParser from '@root/app/server/api/routers/specific/libs/dayIdParser';
import returnPdfForFront from '@root/app/server/api/routers/specific/libs/pdf/returnPdfForFront';
import getGroupedFoodData from '@root/app/server/api/routers/specific/libs/pdf/getGroupedFoodData';
import { type MealInConsumerDataItem } from '@root/app/server/api/routers/specific/libs/getGroupedConsumerFoodDataObject';

const labelsPdf2 = createCateringProcedure([RoleType.kitchen, RoleType.manager, RoleType.dietician])
    .input(getOrdersPdf2Valid)
    .query(async ({ input, ctx }) => {
        const { session: { catering } } = ctx;
        const { dayId, mealId } = input;

        // Control variables
        const showRegularFood = false;
        const showChangedOnly = true;

        const { consumerFoodByRoute, mealGroupName } = await getGroupedFoodData({ dayId, mealId, cateringId: catering.id, groupBy: 'byConsumer' });
        const { year, month, day } = dayIdParser(dayId);

        const currentDate = new Date(year, month, day);
        const formattedDate = format(currentDate, "eeee, dd MMMM yyyy", { locale: pl });
        const headerText = `${mealGroupName} - ${formattedDate}`;
        const fileNameDate = format(currentDate, "yyyy-MM-dd", { locale: pl });

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
            interface LabelInfo {
                deliveryRouteName: string;
                clientCode: string;
                consumerCode: string;
                mealName: string;
                baseFood: string;
            }

            // Helper function to check if consumer has changed foods (alternative, exclusions, or comments)
            const hasChangedFoods = (consumerData: { meals: Record<string, MealInConsumerDataItem> }): boolean => {
                return Object.values(consumerData.meals).some((mealData: MealInConsumerDataItem) =>
                    mealData.consumerFoods.some((cf) =>
                        !!cf.alternativeFood ||
                        (cf.exclusions && cf.exclusions.length > 0) ||
                        !!(cf.comment?.trim())
                    )
                );
            };

            // Extract labels data
            const labelsData: LabelInfo[] = Object.values(consumerFoodByRoute).flatMap(routeData =>
                Object.values(routeData.clients).flatMap(clientData =>
                    Object.values(clientData.consumers).flatMap(consumerData => {
                        const { consumer, meals } = consumerData;

                        // Filter based on showChangedOnly setting
                        if (showChangedOnly && !hasChangedFoods(consumerData)) {
                            return [];
                        }

                        const separateLabelMeals: MealInConsumerDataItem[] = [];
                        const combinedLabelMeals: MealInConsumerDataItem[] = [];

                        Object.values(meals).forEach(mealData => {
                            if (mealData.meal.separateLabel) {
                                separateLabelMeals.push(mealData);
                            } else {
                                combinedLabelMeals.push(mealData);
                            }
                        });
                        combinedLabelMeals.sort((a, b) => (a.meal.order ?? 0) - (b.meal.order ?? 0));

                        const labelsForConsumer: LabelInfo[] = [];

                        for (const mealData of separateLabelMeals) {
                            const sortedFoods = mealData.consumerFoods.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                            const foodDescriptions = sortedFoods.map(cf => {
                                let description = '';

                                // Show food name based on showRegularFood setting
                                if (showRegularFood) {
                                    description = cf.alternativeFood?.name ?? cf.food.name;
                                } else if (cf.alternativeFood) {
                                    description = cf.alternativeFood.name;
                                }

                                // Add exclusions in parentheses
                                if (cf.exclusions && cf.exclusions.length > 0) {
                                    const exclusionNames = cf.exclusions.map(ex => ex.name).join(', ');
                                    description += ` (${exclusionNames})`;
                                }

                                // Add comment in square brackets
                                if (cf.comment?.trim()) {
                                    description += ` [${cf.comment}]`;
                                }

                                return description;
                            }).filter(desc => desc.trim() !== ''); // Remove empty descriptions

                            const foodDescription = foodDescriptions.join(', ');

                            // Only add label if it has content or showChangedOnly is false
                            if (!showChangedOnly || foodDescription.trim() !== '') {
                                labelsForConsumer.push({
                                    deliveryRouteName: routeData.deliveryRouteName ?? '',
                                    clientCode: clientData.clientCode ?? '',
                                    consumerCode: consumer.code ?? '',
                                    mealName: mealData.meal.name,
                                    baseFood: foodDescription,
                                });
                            }
                        }

                        if (combinedLabelMeals.length > 0) {
                            const foodDescriptions = combinedLabelMeals
                                .flatMap(md => {
                                    const sortedFoods = md.consumerFoods.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                                    return sortedFoods.map(cf => {
                                        let description = '';

                                        // Show food name based on showRegularFood setting
                                        if (showRegularFood) {
                                            description = cf.alternativeFood?.name ?? cf.food.name;
                                        } else if (cf.alternativeFood) {
                                            description = cf.alternativeFood.name;
                                        }

                                        // Add exclusions in parentheses
                                        if (cf.exclusions && cf.exclusions.length > 0) {
                                            const exclusionNames = cf.exclusions.map(ex => ex.name).join(', ');
                                            description += ` (${exclusionNames})`;
                                        }

                                        // Add comment in square brackets
                                        if (cf.comment?.trim()) {
                                            description += ` [${cf.comment}]`;
                                        }

                                        return description;
                                    });
                                })
                                .filter(desc => desc.trim() !== '') // Remove empty descriptions
                                .join(', ');

                            // Only add label if it has content or showChangedOnly is false
                            if (!showChangedOnly || foodDescriptions.trim() !== '') {
                                labelsForConsumer.push({
                                    deliveryRouteName: routeData.deliveryRouteName ?? '',
                                    clientCode: clientData.clientCode ?? '',
                                    consumerCode: consumer.code ?? '',
                                    mealName: "Posiłki połączone",
                                    baseFood: foodDescriptions,
                                });
                            }
                        }

                        return labelsForConsumer;

                    })
                )
            );

            labelsData.sort((a, b) => {
                const routeA = a.deliveryRouteName ?? '';
                const routeB = b.deliveryRouteName ?? '';
                if (routeA < routeB) return -1;
                if (routeA > routeB) return 1;

                const clientA = a.clientCode ?? '';
                const clientB = b.clientCode ?? '';
                if (clientA < clientB) return -1;
                if (clientA > clientB) return 1;

                const consumerA = a.consumerCode ?? '';
                const consumerB = b.consumerCode ?? '';
                if (consumerA < consumerB) return -1;
                if (consumerA > consumerB) return 1;

                return 0;
            });


            const mmToPt = (mm: number): number => mm * 2.83465;

            const leftMargin = mmToPt(11);
            const rightMargin = mmToPt(11);
            const topMargin = mmToPt(13);
            const bottomMargin = mmToPt(13);
            const gapX = mmToPt(2.5);

            const columnsPerPage = 5;
            const rowsPerPage = 16;

            const cellWidth = (doc.page.width - leftMargin - rightMargin - (columnsPerPage - 1) * gapX) / columnsPerPage;
            const cellHeight = (doc.page.height - topMargin - bottomMargin) / rowsPerPage;

            labelsData.forEach((label, idx) => {
                if (idx % (columnsPerPage * rowsPerPage) === 0 && idx !== 0) {
                    doc.addPage();
                }
                const indexOnPage = idx % (columnsPerPage * rowsPerPage);
                const row = Math.floor(indexOnPage / columnsPerPage);
                const col = indexOnPage % columnsPerPage;
                const x = leftMargin + col * (cellWidth + gapX);
                const y = topMargin + row * cellHeight;

                const roundingRadius = 5;
                doc.save();
                doc.opacity(0.25);
                doc.lineWidth(0.5);
                doc.dash(4, { space: 2 });
                doc.roundedRect(x, y, cellWidth, cellHeight, roundingRadius).stroke();
                doc.undash();
                doc.restore();

                const padding = 3;

                const routeNamePart = label.deliveryRouteName !== 'Bez trasy' ? `(${label.deliveryRouteName})` : '';

                // Clean consumer code - remove client code prefix if present
                let cleanConsumerCode = label.consumerCode;
                if (label.clientCode && cleanConsumerCode.startsWith(label.clientCode + ' ')) {
                    cleanConsumerCode = cleanConsumerCode.substring((label.clientCode + ' ').length);
                }

                const foodLine = label.baseFood;

                const topInfoFontSize = 6;
                const foodFontSize = 7;

                let currentY = y + padding;

                // Render top info line with custom layout
                doc.font('Roboto-Bold').fontSize(topInfoFontSize);
                const topInfoLineHeight = doc.heightOfString('A', { width: cellWidth - 2 * padding });

                // Left part: client code + route name
                const leftPart = [label.clientCode, routeNamePart].filter(Boolean).join(' ');

                // Render left part (left aligned)
                doc.text(leftPart, x + padding, currentY, {
                    align: 'left',
                    width: cellWidth - 2 * padding,
                    height: topInfoLineHeight,
                    ellipsis: true
                });

                // Render right part (consumer code, right aligned)
                if (cleanConsumerCode) {
                    doc.text(cleanConsumerCode, x + padding, currentY, {
                        align: 'right',
                        width: cellWidth - 2 * padding,
                        height: topInfoLineHeight,
                        ellipsis: true
                    });
                }

                currentY += topInfoLineHeight + 2;


                // Render food line
                doc.font('Roboto').fontSize(foodFontSize);
                const foodLineHeight = doc.heightOfString('A\nA\nA', { width: cellWidth - 2 * padding });
                doc.text(foodLine, x + padding, currentY, {
                    align: 'left',
                    width: cellWidth - 2 * padding,
                    height: foodLineHeight,
                    ellipsis: true
                });

            });

            const range = doc.bufferedPageRange();
            for (let i = range.start; i <= range.start + range.count - 1; i++) {
                doc.switchToPage(i);

                const currentY = doc.y;
                const originalMargins = { ...doc.page.margins };

                doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };

                doc.fontSize(10)
                    .font('Roboto-Bold')
                    .text(headerText, leftMargin, 10 + mmToPt(3), {
                        align: 'center',
                        width: doc.page.width - leftMargin - rightMargin
                    });

                doc.fontSize(10)
                    .font('Roboto')
                    .text(`Page ${i + 1} of ${range.count}`, 0, doc.page.height - 40 + 10, {
                        align: 'center',
                        width: doc.page.width
                    });

                doc.page.margins = originalMargins;
                doc.y = currentY;
            }

            doc.end();
            const fileName = `etykiety_${safeFileName(mealGroupName)}_${fileNameDate}.pdf`
            return returnPdfForFront({ pdfPromise, fileName });
        } catch (error) {
            console.error('Error generating labels PDF:', error);
            throw error;
        }
    });

export default labelsPdf2;
