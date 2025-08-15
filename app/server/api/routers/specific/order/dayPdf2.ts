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

// // --- POCZĄTEK ZMIAN: Funkcja pomocnicza do lorem ipsum ---
// /**
//  * Generates a random "lorem ipsum"-like string.
//  * @param minLength Minimum length of the generated string.
//  * @param maxLength Maximum length of the generated string.
//  * @returns A random string.
//  */
// const generateRandomLorem = (minLength: number, maxLength: number): string => {
//     const loremWords = ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "curabitur", "vel", "hendrerit", "libero", "eleifend", "blandit", "nunc", "ornare", "odio", "ut", "orci", "gravida", "imperdiet", "nullam", "purus", "lacinia", "a", "pretium", "quis", "congue", "praesent", "sagittis", "laoreet", "auctor", "mauris", "non", "velit", "eros", "dictum", "proin", "accumsan", "sapien", "nec", "massa", "volutpat", "venenatis", "sed", "eu", "molestie."];
//     const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
//     let result = '';
//     while (result.length < length) {
//         const word = loremWords[Math.floor(Math.random() * loremWords.length)];
//         result += (result.length > 0 ? ' ' : '') + word;
//     }
//     // Capitalize first letter and add a period if needed
//     result = result.charAt(0).toUpperCase() + result.slice(1);
//     if (!result.endsWith('.')) {
//         result = result.slice(0, length).trimEnd() + '.'; // Trim to approx length and add period
//     }
//     return result.slice(0, maxLength); // Ensure max length
// };
// // --- KONIEC ZMIAN: Funkcja pomocnicza do lorem ipsum ---


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

                        const dietDescription = consumerFoods
                            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                            .map(cf => {
                                const hasAlternative = !!cf.alternativeFood;
                                const hasExclusions = cf.exclusions && cf.exclusions.length > 0;
                                const hasComment = !!cf.comment;

                                if (!hasAlternative && !hasExclusions && !hasComment) {
                                    return null;
                                }

                                const alternativeFoodString = cf.alternativeFood?.name;
                                const exclusionsString = hasExclusions ? `(${cf.exclusions.map(ex => ex.name).join(', ')})` : '';

                                const changeParts = [alternativeFoodString, exclusionsString, cf.comment].filter(Boolean);

                                return `${cf.food.name}: ${changeParts.join(' ')}`;
                            })
                            .filter(Boolean)
                            .join('; ');


                        acc[clientCode]?.mealsByMealName[mealName]?.consumers.push({
                            consumerCode: consumer.code ?? 'UNKNOWN',
                            dietInfo,
                            dietDescription,
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
                    dietDescription: string;
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

        const dictionary = await getDict({ lang, keys: ['shared', 'orders'] })
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

            doc.font('Roboto-Bold')
                .fontSize(20)
                .text(translate(dictionary, 'orders:title'), { align: 'center' });

            doc.moveDown();
            doc.fontSize(16)
                .text(`${mealGroupName} - ${headDate}`, { align: 'center' });

            doc.moveDown(2)
                .fontSize(14)
                .font('Roboto-Bold')
                .text(`${translate(dictionary, 'orders:standard')}: ${summaryStandard}`, { align: 'center' });

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
                // Calculate total meals for this route
                const routeTotalMeals = routeItems.reduce((sum, item) => sum + item.meals, 0);

                // Estimate minimum space needed for route header + first item
                const routeHeaderHeight = 25;
                const minItemHeight = lineHeight + verticalGap; // Minimum for one item without notes
                const minSpaceNeeded = routeHeaderHeight + minItemHeight;

                // Check if we need a new page for the route header + at least one item
                if (yPosition + minSpaceNeeded > doc.page.height - doc.page.margins.bottom - 30) {
                    doc.addPage();
                    yPosition = doc.page.margins.top;
                }

                // Route header with total meals in parentheses
                doc.font('Roboto-Bold')
                    .fontSize(14)
                    .fillColor('black')
                    .text(`Trasa: ${routeName} (${routeTotalMeals})`, 50, yPosition);

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
                    const mealsText = item.meals.toString();
                    const clientCodeText = item.clientCode; // Remove route info from client text since it's now in header

                    doc.font('Roboto')
                        .fontSize(12)
                        .fillColor('black')
                        .text(clientCodeText, clientX, yPosition, {
                            lineBreak: false,
                            continued: true
                        });

                    const clientWidth = doc.widthOfString(clientCodeText);
                    const mealsX = clientX + clientWidth + 5;

                    doc.font('Roboto-Bold')
                        .fontSize(12)
                        .text(mealsText, mealsX, yPosition, {
                            lineBreak: false,
                            continued: false
                        });

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
                            dietDescription: string;
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

                // Route header for diets
                doc.moveDown()
                    .fontSize(14)
                    .font('Roboto-Bold')
                    .fillColor('black')
                    .text(`Trasa: ${routeName}`, 50);

                // Render clients for this route
                routeClients.forEach(({ clientCode, mealsByMealName }) => {
                    // Check space for client header + at least one diet item
                    const clientSpaceNeeded = 20 + 12 + 11; // 20 points for moveDown, 12 points for client fontSize, 11 points for diet item

                    if (doc.y + clientSpaceNeeded > doc.page.height - doc.page.margins.bottom - 30) {
                        doc.addPage();
                        doc.y = doc.page.margins.top;
                    }

                    doc.moveDown()
                        .fontSize(12)
                        .font('Roboto-Bold')
                        .text(clientCode, 70)
                        .font('Roboto');

                    Object.entries(mealsByMealName).forEach(([mealName, mealDetails]) => {
                        if (doc.y + 20 > doc.page.height - doc.page.margins.bottom - 30) {
                            doc.addPage();
                            doc.y = doc.page.margins.top;
                        }

                        doc.moveDown(0.5);
                        doc.fontSize(11).font('Roboto-Bold').text(`${mealName} (${mealDetails.baseFoodName})`, 80);
                        doc.font('Roboto');

                        mealDetails.consumers.forEach(diet => {
                            if (doc.y + 15 > doc.page.height - doc.page.margins.bottom - 30) {
                                doc.addPage();
                                doc.y = doc.page.margins.top;
                            }
                            const description = diet.dietDescription ? ` ${diet.dietDescription}` : '';
                            doc.fontSize(10).text(`${diet.consumerCode}${diet.dietInfo}:${description}`, 90, doc.y, {
                                width: doc.page.width - 120
                            });
                        });
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
            return returnPdfForFront({ pdfPromise, fileName });
        } catch (error) {
            console.error('Błąd podczas generowania PDF:', error);
            throw error;
        }

    });

export default dayPdf2;