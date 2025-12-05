import translate from '@root/app/lib/lang/translate';
import PDFDocument from 'pdfkit';
import { loadFonts } from '@root/app/lib/loadFonts';
import dayIdParser from '@root/app/server/api/routers/specific/libs/dayIdParser';
import { type TransformedConsumerData } from '../../getGroupedConsumerFoodDataObject';
import cleanConsumerName from '@root/app/server/api/routers/specific/libs/consumerFoods/dayMenuPdf/cleanConsumerName';
import getFooterText from '@root/app/server/api/routers/specific/libs/consumerFoods/dayMenuPdf/getFooterText';
import getPdfTitle from '@root/app/server/api/routers/specific/libs/consumerFoods/dayMenuPdf/getPdfTitle';
import { type GetDayFoodDataResult } from '@root/app/server/api/routers/specific/libs/getDayFoodData';
import getFileName from '@root/app/server/api/routers/specific/libs/consumerFoods/dayMenuPdf/getFileName';
import { type Consumer } from '@prisma/client';

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

const generatePDF = async ({
    allMealsData,
    mealGroupOrder,
    clientId,
    clientCode,
    dayDate,
    week,
    dictionary,
    consumer,
    addExtension
}: {
    allMealsData: GetDayFoodDataResult,
    mealGroupOrder: string[],
    clientId?: string,
    clientCode: string,
    dayDate: Date,
    week: boolean,
    dictionary: Record<string, string>,
    consumer?: Consumer,
    addExtension?: boolean

}) => {
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

    const forWhom = consumer ? cleanConsumerName(consumer.code, clientCode) : clientCode;

    let categoryCode: string | undefined;
    const targetClientId = clientId ?? consumer?.clientId;

    if (targetClientId && allMealsData) {
        searchLoop:
        for (const dayData of Object.values(allMealsData)) {
            if (!dayData) continue;
            for (const groupData of Object.values(dayData)) {
                if (!groupData?.routes) continue;
                for (const routeData of Object.values(groupData.routes)) {
                    const clientData = routeData.clients[targetClientId];
                    if (clientData?.client?.clientCategory?.code) {
                        categoryCode = clientData.client.clientCategory.code;
                        break searchLoop;
                    }
                }
            }
        }
    }

    const titleForWhom = categoryCode ? `${forWhom} (${categoryCode})` : forWhom;

    const pdfTitle = getPdfTitle({ dayDate, forWhom: titleForWhom, isWeek: week, dictionary });
    doc.font('Roboto-Bold')
        .fontSize(pdfConfig.fontSize.title)
        .text(pdfTitle, { align: 'center' });

    const availableDays = Object.keys(allMealsData).sort();

    let isFirstDay = true;
    for (const currentDayId of availableDays) {
        // Parse current day and format date for display
        const { year: currentYear, month: currentMonth, day: currentDay } = dayIdParser(currentDayId);
        const currentDayDate = new Date(currentYear, currentMonth, currentDay);

        // Add day header if we have multiple days
        if (availableDays.length > 1) {
            if (!isFirstDay) {
                doc.addPage();
            }

            doc.moveDown(2);
            const dayHeader = currentDayDate.toLocaleDateString('pl-PL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            doc.font('Roboto-Bold')
                .fontSize(pdfConfig.fontSize.subtitle)
                .text(dayHeader, { align: 'center' });
            doc.moveDown(1);
        }
        isFirstDay = false;

        let isFirstMealGroup = true;
        for (const mealGroupId of mealGroupOrder) {
            if (!allMealsData[currentDayId]?.[mealGroupId]) continue;

            const mealGroupData = allMealsData[currentDayId][mealGroupId];
            const consumerFoodByRoute = mealGroupData?.routes;
            const mealGroupName = mealGroupData?.mealGroup?.name;

            if (!consumerFoodByRoute || !mealGroupName) continue;

            // Only add new page for meal groups if not filtering by specific client
            // and it's not the first meal group in a day (except for multi-day where each day starts new page)
            if (!isFirstMealGroup && !clientId && availableDays.length === 1) {
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
                    const { clientCode: rawClientCode, consumers, client } = clientData;

                    const categoryCode = client.clientCategory?.code;
                    const clientCode = categoryCode ? `${rawClientCode} (${categoryCode})` : rawClientCode;

                    Object.entries(consumers).forEach(([_consumerId, consumerData]) => {
                        const { consumer, meals } = consumerData;
                        // console.log('consumer', consumer);

                        if (!acc[clientCode]) {
                            acc[clientCode] = { mealsByMealName: {}, deliveryRouteInfo: deliveryRouteName, consumers: {} };
                        }
                        const clientAcc = acc[clientCode];

                        Object.entries(meals).forEach(([_mealId, mealData]) => {
                            const { meal, consumerFoods } = mealData;
                            const mealName = meal.name;

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
                                if (shouldCleanConsumerName && rawClientCode) {
                                    consumerCode = cleanConsumerName(consumer.code, rawClientCode);
                                }

                                mealDetails.consumersInfo.push({
                                    consumerCode,
                                    dietInfo,
                                    dietDescriptionParts,
                                });
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

        const footerText = getFooterText({ dayDate, clientCode, i, range, week });

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

    const fileName = getFileName({
        dayDate,
        clientCode,
        isWeek: week,
        consumerCode: consumer ? forWhom : undefined
    });
    doc.end();
    return {
        fileName: addExtension ? `${fileName}.pdf` : fileName,
        pdfPromise
    };
}

export default generatePDF;