// import { db } from '@root/app/server/db';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import type { MealType, OrderMealPopulated } from '@root/types/specific';
import { RoleType, type Client, type OrderConsumerBreakfast, type OrderStatus } from '@prisma/client';
// import processMeals from '@root/app/server/api/routers/specific/libs/processMeals';

// import { Document, Font, Page, StyleSheet, Text, View, Svg, Path, pdf as pdfRender } from '@react-pdf/renderer';
// import React from 'react';
import translate from '@root/app/lib/lang/translate';
import { format } from 'date-fns-tz';
import { pl } from 'date-fns/locale';
import { getDict } from '@root/app/server/cache/translations';
import { getOrdersPdfValid } from '@root/app/validators/specific/order';
import safeFileName from '@root/app/lib/safeFileName';
import PDFDocument from 'pdfkit';
import processMeals from '@root/app/server/api/routers/specific/libs/processMeals';
import { db } from '@root/app/server/db';
import { loadFonts } from '@root/app/lib/loadFonts';
import dayIdParser from '@root/app/server/api/routers/specific/libs/dayIdParser';
import returnPdfForFront from '@root/app/server/api/routers/specific/libs/pdf/returnPdfForFront';

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


const dayPdf = createCateringProcedure([RoleType.kitchen, RoleType.manager, RoleType.dietician])
    .input(getOrdersPdfValid)
    .query(async ({ input, ctx }) => {
        const { session: { catering } } = ctx;
        const { dayId, mealType, lang } = input;

        const { year, month, day } = dayIdParser(dayId);

        const standardFields = {
            breakfast: "breakfastStandard",
            lunch: "lunchStandard",
            dinner: "dinnerStandard",
        }

        const dietsCollections = {
            breakfast: 'OrderConsumerBreakfast',
            lunch: 'OrderConsumerLunch',
            dinner: 'OrderConsumerDinner',
        }

        const dayData = await db.order.aggregateRaw({
            pipeline: [
                {
                    $match: {
                        cateringId: catering.id,
                        status: { $ne: 'draft' },
                        deliveryDay: {
                            year,
                            month,
                            day
                        }
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
                {
                    $lookup: {
                        from: `${dietsCollections[mealType]}`,
                        let: { orderId: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$orderId', '$$orderId'] } } },
                            {
                                $lookup: {
                                    from: 'Consumer',
                                    localField: 'consumerId',
                                    foreignField: '_id',
                                    as: 'consumer'
                                }
                            },
                            { $unwind: '$consumer' }
                        ],
                        as: 'diet'
                    }
                },
                {
                    $addFields: {
                        standard: `$${standardFields[mealType]}`,
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
                        diet: 1,
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
            client: Client;
            status: OrderStatus;
            sentToCateringAt: { $date: Date };
            standard: number;
            notes: string; // Ta wartość zostanie nadpisana przez logikę debugową poniżej
            diet: (OrderConsumerBreakfast & OrderMealPopulated)[];
            deliveryRoute?: { code: string; name: string };
        }[]

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

        const dietObject = dayData.reduce((acc, { client, diet, deliveryRoute }) => {
            const code = client?.info?.code;
            if (code) {
                if (!acc[code]) {
                    acc[code] = { meals: {}, deliveryRouteInfo: '' };
                }
                const newMeals = processMeals(diet);
                Object.entries(newMeals).forEach(([consumerCode, mealData]) => {
                    if (!acc[code]?.meals[consumerCode]) {
                        acc[code]!.meals[consumerCode] = mealData;
                    }
                });
                if (deliveryRoute && !acc[code].deliveryRouteInfo) {
                    acc[code].deliveryRouteInfo = deliveryRoute.name;
                }
            }
            return acc;
        }, {} as Record<string, { meals: Record<string, { code: string, description: string }>, deliveryRouteInfo: string }>);


        const standard = Object.entries(standardObject).map(([clientCode, { meals, deliveryRouteInfo }]) => ({
            clientCode,
            meals,
            deliveryRouteInfo
        })).filter(({ meals }) => meals);

        const diet = Object.entries(dietObject).reduce((acc, [clientCode, { meals, deliveryRouteInfo }]) => {
            acc[clientCode] = {
                deliveryRouteInfo,
                meals: Object.entries(meals).map(([consumerCode, diet]) => ({
                    consumerCode,
                    diet,
                }))
            };
            return acc;
        }, {} as Record<string, { deliveryRouteInfo: string, meals: { consumerCode: string, diet: { code: string, description: string } }[] }>);

        const dictionary = await getDict({ lang, keys: ['shared', 'orders'] })

        const translations = {
            breakfast: translate(dictionary, 'orders:breakfast'),
            lunch: translate(dictionary, 'orders:lunch'),
            dinner: translate(dictionary, 'orders:dinner'),
        } as Record<MealType, string>

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
                .text(`${translations[mealType]} - ${headDate}`, { align: 'center' });

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

            standard.forEach(item => {
                const noteText = notes[item.clientCode];
                let itemHeight = lineHeight; // Minimalna wysokość to linia kodu/ilości
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

                // --- POCZĄTEK ZMIAN: Dostosowanie odstępu clientCode - meals ---
                const clientX = 50;
                const mealsText = item.meals.toString();
                const clientCodeText = `${item.clientCode}${item.deliveryRouteInfo ? ` (${item.deliveryRouteInfo})` : ''}`;

                // Rysuj kod klienta, bez określonej szerokości, aby zajął tyle ile potrzebuje
                doc.font('Roboto')
                    .fontSize(12)
                    .fillColor('black')
                    .text(clientCodeText, clientX, yPosition, {
                        lineBreak: false, // Zapobiega łamaniu
                        continued: true // Pozwala dodać tekst zaraz obok
                    });

                // Zmierz szerokość kodu klienta
                const clientWidth = doc.widthOfString(clientCodeText);
                const mealsX = clientX + clientWidth + 5; // 5 punktów odstępu

                // Rysuj ilość posiłków zaraz obok
                doc.font('Roboto-Bold')
                    .fontSize(12)
                    .text(mealsText, mealsX, yPosition, { // Użyj tej samej pozycji Y
                        // nie podajemy width, niech zajmie ile trzeba
                        lineBreak: false, // Kończymy linię po ilości
                        continued: false // Zakończ linię tutaj
                    });
                // --- KONIEC ZMIAN: Dostosowanie odstępu clientCode - meals ---

                yPosition += lineHeight; // Przesuń Y o wysokość linii klienta/ilości

                // Add notes if they exist
                if (noteText) {
                    // --- POCZĄTEK ZMIAN: Ciemniejszy kolor notatek ---
                    doc.font('Roboto')
                        .fontSize(noteFontSize)
                        .fillColor('dimgray') // Ciemniejszy szary
                        .text(noteText, clientX, yPosition, { // Notatka pod kodem klienta
                            width: pageWidth - 10 // Notatka na prawie całą szerokość strony
                        });
                    // --- KONIEC ZMIAN: Ciemniejszy kolor notatek ---
                    yPosition += noteHeight; // Przesuń Y o wysokość notatki
                }

                yPosition += verticalGap; // Dodaj stały odstęp przed kolejnym wpisem
            });

            doc.y = yPosition; // Ustaw pozycję Y dla sekcji diet

            doc.x = 50;
            doc.moveDown(4)
                .fontSize(14)
                .font('Roboto-Bold')
                .fillColor('black')
                .text(translate(dictionary, 'orders:diet'), {
                    width: pageWidth,
                    align: 'center'
                });

            Object.entries(diet).filter(([_, { meals }]) => meals.length > 0).forEach(([clientCode, { meals: dietMeals, deliveryRouteInfo }]) => {
                if (doc.y + 30 > doc.page.height - doc.page.margins.bottom - 30) {
                    doc.addPage();
                    doc.y = doc.page.margins.top;
                }

                doc.moveDown()
                    .fontSize(12)
                    .font('Roboto-Bold')
                    .text(`${clientCode}${deliveryRouteInfo ? ` (${deliveryRouteInfo})` : ''}`, 50)
                    .font('Roboto');


                dietMeals.forEach(dietMeal => {
                    if (doc.y + 15 > doc.page.height - doc.page.margins.bottom - 30) {
                        doc.addPage();
                        doc.y = doc.page.margins.top;
                    }
                    doc.fontSize(11).text(`${dietMeal.consumerCode}: ${dietMeal.diet.code}`, 70);
                });
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
                        `${footerDate}     ${i + 1}/${range.count}     ${translations[mealType]}`,
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

            const fileName = `${safeFileName(translations[mealType])}_${fileNameDate}.pdf`
            return returnPdfForFront({ pdfPromise, fileName });
        } catch (error) {
            console.error('Błąd podczas generowania PDF:', error);
            throw error;
        }

    });

export default dayPdf;