// import { db } from '@root/app/server/db';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { RoleType } from '@prisma/client';
// import processMeals from '@root/app/server/api/routers/specific/libs/processMeals';

// import { Document, Font, Page, StyleSheet, Text, View, Svg, Path, pdf as pdfRender } from '@react-pdf/renderer';
// import React from 'react';
import translate from '@root/app/lib/lang/translate';
import { format } from 'date-fns-tz';
import { pl } from 'date-fns/locale';
import { getDict } from '@root/app/server/cache/translations';
import { getDayKitchenPdfValid } from '@root/app/validators/specific/order';
import PDFDocument from 'pdfkit';
import { loadFonts } from '@root/app/lib/loadFonts';
import dayIdParser from '@root/app/server/api/routers/specific/libs/dayIdParser';
import returnPdfForFront from '@root/app/server/api/routers/specific/libs/pdf/returnPdfForFront';
import getDayFoodData from '@root/app/server/api/routers/specific/libs/getDayFoodData';
import { type TransformedConsumerData } from '../getGroupedConsumerFoodDataObject';
import { db } from '@root/app/server/db';

// PDF Configuration
const pdfConfig = {
    margins: {
        default: 50,
        header: 0,
        footer: 0,
        content: {
            left: 50, //70,
            right: 50, //70,
            bottom: 20, //30,
        }
    },
    fontSize: {
        title: 20,
        subtitle: 16,
        mealGroup: 16, //18,
        client: 11, //13,
        meal: 10, //12,
        content: 8, //10,
        footer: 10,
    }
};

const shouldCleanConsumerName = true;

const cleanConsumerName = (consumerName: string | null | undefined, clientCode: string): string => {
    if (!consumerName) return 'UNKNOWN';
    const prefix = `${clientCode} `;
    if (consumerName.startsWith(prefix)) {
        return consumerName.slice(prefix.length);
    }
    return consumerName;
};

const dayMenuPdf = createCateringProcedure([RoleType.kitchen, RoleType.manager, RoleType.dietician])
    .input(getDayKitchenPdfValid)
    .query(async ({ input, ctx }) => {
        const { session: { catering } } = ctx;
        const { dayId, lang, clientId } = input;

        const allMealsData = await getDayFoodData({ dayId, cateringId: catering.id, ignoreOrders: true, clientId });
        const mealGroups = await db.mealGroup.findMany({ orderBy: { order: 'asc' } });
        const mealGroupOrder = mealGroups.map(mg => mg.name);

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

            let pdfTitle = translate(dictionary, 'menu-creator:pdf-title');
            let pdfFileName = `jadlospis_${fileNameDate}`;


            if (clientId) {
                const client = await db.client.findUnique({ where: { id: clientId } });
                if (client) {
                    pdfTitle = translate(dictionary, 'menu-creator:pdf-title-for-client', [client.info.code ?? '']);
                    pdfFileName = `${client.info.code}_${pdfFileName}`;
                } else {
                    throw new Error('Client not found');
                }
            }

            doc.font('Roboto-Bold')
                .fontSize(pdfConfig.fontSize.title)
                .text(pdfTitle, { align: 'center' });

            doc.moveDown();
            doc.fontSize(pdfConfig.fontSize.subtitle)
                .text(headDate, { align: 'center' });


            let isFirstMealGroup = true;
            for (const mealGroupName of mealGroupOrder) {
                if (!allMealsData[mealGroupName]) continue;

                const consumerFoodByRoute = allMealsData[mealGroupName];

                if (!consumerFoodByRoute) continue;

                // Only add new page for meal groups if not filtering by specific client
                if (!isFirstMealGroup && !clientId) {
                    doc.addPage();
                }
                isFirstMealGroup = false;

                // Check if we have enough space for meal group title + at least one line of content
                // Only relevant when clientId is provided (groups don't start new pages)
                if (clientId) {
                    const minRequiredHeight = 80; // Space for title + at least one line of content
                    if (doc.y + minRequiredHeight > doc.page.height - doc.page.margins.bottom - pdfConfig.margins.content.bottom) {
                        doc.addPage();
                        doc.y = doc.page.margins.top;
                    }
                }

                doc.moveDown(2);
                doc.font('Roboto-Bold').fontSize(pdfConfig.fontSize.mealGroup).text(mealGroupName, { align: 'center' });

                const dietDataByClient = Object.entries(consumerFoodByRoute).reduce((acc, [_routeId, routeData]) => {
                    const { deliveryRouteName, clients } = routeData;

                    Object.entries(clients).forEach(([_clientId, clientData]) => {
                        const { clientCode, consumers } = clientData;

                        Object.entries(consumers).forEach(([_consumerId, consumerData]) => {
                            const { consumer, meals } = consumerData;

                            const clientAcc = acc[clientCode];
                            if (!clientAcc) {
                                acc[clientCode] = { mealsByMealName: {}, deliveryRouteInfo: deliveryRouteName, consumers: {} };
                            }

                            Object.entries(meals).forEach(([_mealId, mealData]) => {
                                const { meal, consumerFoods } = mealData;
                                const mealName = meal.name;

                                if (clientAcc) {
                                    if (!clientAcc.mealsByMealName[mealName]) {
                                        const sortedFoodItems = consumerFoods.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                                        const baseFoodName = sortedFoodItems.map(item => item.food.name).join(', ');
                                        clientAcc.mealsByMealName[mealName] = {
                                            baseFoodName,
                                            consumersInfo: [],
                                        };
                                    }

                                    let dietInfo = '';
                                    if (consumer.diet) {
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


                                    const mealDetails = clientAcc.mealsByMealName[mealName];
                                    if (mealDetails) {
                                        let consumerCode = consumer.code ?? 'UNKNOWN';
                                        if (shouldCleanConsumerName && clientCode) {
                                            consumerCode = cleanConsumerName(consumer.code, clientCode);
                                        }

                                        mealDetails.consumersInfo.push({
                                            consumerCode,
                                            dietInfo,
                                            dietDescriptionParts,
                                        });
                                    }
                                }
                            });
                        });
                    });

                    return acc;
                }, {} as Record<string, {
                    mealsByMealName: Record<string, {
                        baseFoodName: string;
                        consumersInfo: {
                            consumerCode: string;
                            dietInfo: string;
                            dietDescriptionParts: { text: string, font: string }[];
                        }[];
                    }>,
                    deliveryRouteInfo: string;
                    consumers: Record<string, TransformedConsumerData>;
                }>);


                const clientsForDiets = Object.entries(dietDataByClient)
                    .filter(([_, { mealsByMealName }]) => Object.keys(mealsByMealName).length > 0)
                    .map(([clientCode, { mealsByMealName }]) => ({
                        clientCode,
                        mealsByMealName
                    }))
                    .sort((a, b) => a.clientCode.localeCompare(b.clientCode));

                clientsForDiets.forEach(({ clientCode, mealsByMealName }) => {
                    const minClientHeight = 80;
                    if (doc.y + minClientHeight > doc.page.height - doc.page.margins.bottom) {
                        doc.addPage();
                        doc.y = doc.page.margins.top;
                    }

                    // Only show client code if not filtering by specific client
                    if (!clientId) {
                        doc.fontSize(pdfConfig.fontSize.client)
                            .font('Roboto-Bold')
                            .text(clientCode, pdfConfig.margins.content.left)
                            .font('Roboto');
                    }

                    const sortedMealNames = Object.keys(mealsByMealName).sort();

                    sortedMealNames.forEach(mealName => {
                        const mealDetails = mealsByMealName[mealName];
                        if (!mealDetails) return;

                        if (doc.y + 20 > doc.page.height - doc.page.margins.bottom - pdfConfig.margins.content.bottom) {
                            doc.addPage();
                            doc.y = doc.page.margins.top;
                        }

                        doc.moveDown(0.5);
                        doc.fontSize(pdfConfig.fontSize.meal).font('Roboto-Bold').text(`${mealName} (${mealDetails.baseFoodName})`, pdfConfig.margins.content.left);
                        doc.font('Roboto');

                        const consumersWithChanges = mealDetails.consumersInfo.filter(diet => diet.dietDescriptionParts.length > 0);
                        const consumersWithoutChanges = mealDetails.consumersInfo.filter(diet => diet.dietDescriptionParts.length === 0);

                        if (consumersWithChanges.length > 0) {
                            doc.moveDown(0.5);
                            consumersWithChanges.forEach(diet => {
                                if (doc.y + 15 > doc.page.height - doc.page.margins.bottom - pdfConfig.margins.content.bottom) {
                                    doc.addPage();
                                    doc.y = doc.page.margins.top;
                                }

                                const bulletWithSpace = '• ';
                                const consumerCodeText = diet.consumerCode;
                                const dietInfoText = `${diet.dietInfo}: `;

                                doc.font('Roboto').fontSize(pdfConfig.fontSize.content).text(bulletWithSpace, pdfConfig.margins.content.left, doc.y, { continued: true });
                                doc.font('Roboto-Bold').fontSize(pdfConfig.fontSize.content).text(consumerCodeText, { continued: true });
                                doc.font('Roboto').fontSize(pdfConfig.fontSize.content).text(dietInfoText, { continued: true });

                                diet.dietDescriptionParts.forEach((part, index) => {
                                    const isLastPart = index === diet.dietDescriptionParts.length - 1;
                                    doc.font(part.font).fontSize(pdfConfig.fontSize.content).text(part.text, {
                                        continued: !isLastPart,
                                    });
                                });
                                doc.moveDown(0.25);
                            });
                        }

                        if (consumersWithoutChanges.length > 0) {
                            if (consumersWithChanges.length === 0) {
                                doc.moveDown(0.5);
                            } else {
                                doc.moveDown(0.25);
                            }
                            if (doc.y + 15 > doc.page.height - doc.page.margins.bottom - pdfConfig.margins.content.bottom) {
                                doc.addPage();
                                doc.y = doc.page.margins.top;
                            }

                            const noChangesText = consumersWithoutChanges.map(diet => `${diet.consumerCode}${diet.dietInfo}`).join(', ');
                            const label = `${translate(dictionary, 'menu-creator:no-changes')}: `;

                            doc.fontSize(pdfConfig.fontSize.content).font('Roboto-Bold').text(label, pdfConfig.margins.content.left, doc.y, { continued: true });
                            doc.font('Roboto').text(noChangesText, {
                                width: doc.page.width - (pdfConfig.margins.content.left * 2) - doc.widthOfString(label)
                            });
                        }
                    });

                    doc.moveDown(1);
                    doc.strokeColor('#cccccc')
                        .lineWidth(0.5)
                        .moveTo(pdfConfig.margins.content.left, doc.y)
                        .lineTo(doc.page.width - pdfConfig.margins.content.right, doc.y)
                        .stroke();
                    doc.moveDown(1);
                });
            }

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

                let footerText = `${footerDate}     ${i + 1}/${range.count}`;

                // Add client code to footer if PDF is for specific client
                if (clientId) {
                    const client = await db.client.findUnique({ where: { id: clientId } });
                    if (client?.info.code) {
                        footerText = `${client.info.code}     ${footerDate}     ${i + 1}/${range.count}`;
                    }
                }

                doc.fontSize(pdfConfig.fontSize.footer)
                    .font('Roboto')
                    .fillColor('black')
                    .text(
                        footerText,
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

            const fileName = `${pdfFileName}.pdf`
            return returnPdfForFront({ pdfPromise, fileName });
        } catch (error) {
            console.error('Błąd podczas generowania PDF:', error);
            throw error;
        }

    });

export default dayMenuPdf;