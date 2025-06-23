// import { db } from '@root/app/server/db';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import type { MealType, OrderMealPopulated } from '@root/types/specific';
import { RoleType, type Client, type DeliveryRoute, type OrderConsumerBreakfast, type OrderStatus } from '@prisma/client';
import translate from '@root/app/lib/lang/translate';
import { format } from 'date-fns-tz';
import { pl } from 'date-fns/locale';
import { getDict } from '@root/app/server/cache/translations';
import { getOrdersPdfValid } from '@root/app/validators/specific/order';
import safeFileName from '@root/app/lib/safeFileName';
import PDFDocument from 'pdfkit';
import { db } from '@root/app/server/db';
import { loadFonts } from '@root/app/lib/loadFonts';
import dayIdParser from '@root/app/server/api/routers/specific/libs/dayIdParser';
import limitTextToMaxLines from '@root/app/server/api/routers/specific/libs/pdf/limitTextToMaxLines';
import returnPdfForFront from '@root/app/server/api/routers/specific/libs/pdf/returnPdfForFront';
const labelsPdf = createCateringProcedure([RoleType.kitchen, RoleType.manager, RoleType.dietician])
    .input(getOrdersPdfValid)
    .query(async ({ input, ctx }) => {
        const { session: { catering } } = ctx;
        const { dayId, mealType, lang } = input;

        // Parse date parts from dayId
        const { year, month, day } = dayIdParser(dayId);

        const dictionary = await getDict({ lang, keys: ['shared', 'orders'] })

        const translations = {
            breakfast: translate(dictionary, 'orders:breakfast'),
            lunch: translate(dictionary, 'orders:lunch'),
            dinner: translate(dictionary, 'orders:dinner'),
        } as Record<MealType, string>
        // Prepare header text with mealType and human readable day
        const currentDate = new Date(year, month, day);
        const formattedDate = format(currentDate, "eeee, dd MMMM yyyy", { locale: pl });
        const headerText = `${translate(dictionary, translations[mealType])} - ${formattedDate}`;
        const fileNameDate = format(currentDate, "yyyy-MM-dd ", { locale: pl });

        // Query to get dayData with client info
        const dietsCollections = {
            breakfast: 'OrderConsumerBreakfast',
            lunch: 'OrderConsumerLunch',
            dinner: 'OrderConsumerDinner',
        };


        const dayData = await db.order.aggregateRaw({
            pipeline: [
                {
                    $match: {
                        cateringId: catering.id,
                        status: { $ne: 'draft' },
                        deliveryDay: { year, month, day }
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
                { $unwind: '$client' },
                {
                    $lookup: {
                        from: 'DeliveryRoute',
                        localField: 'client.deliveryRouteId',
                        foreignField: '_id',
                        as: 'client.deliveryRoute'
                    }
                },
                {
                    $unwind: {
                        path: '$client.deliveryRoute',
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
                    $project: {
                        _id: 1,
                        cateringId: 1,
                        clientId: 1,
                        client: 1,
                        status: 1,
                        diet: 1,
                        deliveryDay: 1,
                        notes: 1,
                        sentToCateringAt: 1,
                        createdAt: 1,
                        updatedAt: 1
                    }
                }
            ]
        }) as unknown as {
            _id: string;
            client: Client & { deliveryRoute?: DeliveryRoute };
            status: OrderStatus;
            sentToCateringAt: { $date: Date };
            diet: (OrderConsumerBreakfast & OrderMealPopulated)[];
        }[];

        try {
            // Create PDF document
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                bufferPages: true,
                font: ''
            });

            // Buffer to accumulate PDF data
            const buffers: Buffer[] = [];
            doc.on('data', (chunk: Buffer) => buffers.push(chunk));
            const pdfPromise = new Promise<Buffer>((resolve) => {
                doc.on('end', () => resolve(Buffer.concat(buffers)));
            });

            const fonts = await loadFonts();

            doc.registerFont('Roboto', fonts.regular);
            doc.registerFont('Roboto-Bold', fonts.bold);

            // Extract labels data
            const labelsData = dayData.flatMap(order =>
                order.diet.map(item => {
                    const deliveryRouteName = order.client.deliveryRoute?.name ?? '';
                    // const clientCode = order.client.info.code ?? '';
                    const consumerCode = item.consumer.code ?? '';
                    const dietCode = item.consumer.diet?.code ?? '';
                    const dietDescription = item.consumer.diet?.description ?? '';
                    return {
                        deliveryRouteName,
                        // clientCode,
                        consumerCode,
                        dietCode,
                        dietDescription
                    };
                })
            );

            // Reworked grid drawing based on printed label sheet specifications
            const mmToPt = (mm: number): number => mm * 2.83465; // conversion factor from mm to points

            const leftMargin = mmToPt(11);    // 11mm from the left edge
            const rightMargin = mmToPt(11);   // 11mm from the right edge
            const topMargin = mmToPt(13);     // 13mm from the top edge
            const bottomMargin = mmToPt(13);  // 13mm from the bottom edge
            const gapX = mmToPt(2.5);         // 2.5mm horizontal gap between columns

            const columnsPerPage = 5;
            const rowsPerPage = 16;

            // Calculate cell dimensions
            const cellWidth = (doc.page.width - leftMargin - rightMargin - (columnsPerPage - 1) * gapX) / columnsPerPage;
            const cellHeight = (doc.page.height - topMargin - bottomMargin) / rowsPerPage;

            labelsData.forEach((label, idx) => {
                // Add new page if the current one is full (grid 5x16)
                if (idx % (columnsPerPage * rowsPerPage) === 0 && idx !== 0) {
                    doc.addPage();
                }
                const indexOnPage = idx % (columnsPerPage * rowsPerPage);
                const row = Math.floor(indexOnPage / columnsPerPage);
                const col = indexOnPage % columnsPerPage;
                const x = leftMargin + col * (cellWidth + gapX);
                const y = topMargin + row * cellHeight;

                // Draw label border with rounded corners, reduced line width and dashed line style
                const roundingRadius = 5; // Corner radius in points
                doc.save();
                doc.opacity(0.25);
                doc.lineWidth(0.5); // Reduced border line width
                doc.dash(4, { space: 2 }); // Dashed line (4pt dash with 2pt gap)
                doc.roundedRect(x, y, cellWidth, cellHeight, roundingRadius).stroke();
                doc.undash(); // Reset dashing pattern after drawing the rectangle
                doc.restore();

                const padding = 3;
                // label.clientCode = 'AGU3SDFSDF';
                // label.consumerName = 'Melisa Wolska-Wojciechowskaasdfsadfasdfasdfsdf asdfasdfasdf';
                // label.dietCode = 'WEGDFFSDF';
                // label.dietDescription = 'al;skdjf asalsdkjf lksjdf;lksdl;fkasjdlfkasjdflaksdjflaskdjf asldkfjas; alsdkfjas dlfkasjdlfaksjdflaskdjfasldkfjasld asd;flkasjdflk alskdjfl;askdfjlasdf';
                const [clientCode, consumerCodeOnly] = (label.consumerCode ?? '').split(/ (.*)/s, 2);
                const routeNamePart = label.deliveryRouteName ? `(${label.deliveryRouteName})` : '';
                const clientPartWithRoute = `${clientCode ?? ''} ${routeNamePart}`.trim();
                const firstLine = `${clientPartWithRoute} ${consumerCodeOnly ?? ''}`.trim();
                const secondLine = `${label.dietCode}${label.dietCode && label.dietDescription.length ? ":" : ""} ${label.dietDescription}`;

                // Zdefiniuj zmienne z rozmiarem czcionki
                const firstLineFontSize = 7;
                const secondLineFontSize = 5;

                // Ustaw font dla obliczenia ograniczonego tekstu i oblicz limitedFirstLine
                doc.font('Roboto').fontSize(firstLineFontSize);
                const firstLimitedText = limitTextToMaxLines(doc, firstLine, 2, cellWidth - 2 * padding);

                // Ustaw font dla obliczenia ograniczonego tekstu i oblicz limitedSecondLine
                doc.font('Roboto').fontSize(secondLineFontSize);
                const secondLimitedText = limitTextToMaxLines(doc, secondLine, 3, cellWidth - 2 * padding);

                // Renderowanie pierwszej linii tekstu z wykorzystaniem firstLineFontSize
                const firstLineArray = firstLimitedText.split('\n');
                let currentY = y + padding;
                firstLineArray.forEach((line) => {
                    // Podziel linię na pierwszą część przed spacją i resztę
                    let leftPart = line;
                    let rightPart = '';

                    if (consumerCodeOnly && line.endsWith(consumerCodeOnly)) {
                        const index = line.lastIndexOf(consumerCodeOnly);
                        leftPart = line.substring(0, index).trim();
                        rightPart = consumerCodeOnly;
                    }

                    // Oblicz dostępną szerokość
                    const availableWidth = cellWidth - 2 * padding;

                    // Renderuj kod klienta do lewej
                    doc.font('Roboto-Bold')
                        .text(leftPart, x + padding, currentY, { lineBreak: false });

                    // Jeśli istnieje kod konsumenta, renderuj do prawej
                    if (rightPart) {
                        const consumerWidth = doc.font('Roboto')
                            .widthOfString(rightPart, { lineBreak: false });
                        const consumerX = x + padding + availableWidth - consumerWidth;

                        doc.font('Roboto')
                            .text(rightPart, consumerX, currentY, { lineBreak: false });
                    }

                    currentY += doc.heightOfString(line, { lineBreak: false });
                });

                // Rysowanie linii dzielącej
                const dividerY = currentY + 2;
                doc.save();
                doc.opacity(0.5);
                doc.lineWidth(0.5);
                doc.moveTo(x + padding, dividerY)
                    .lineTo(x + cellWidth - padding, dividerY)
                    .stroke();
                doc.restore();

                // Dodanie dodatkowej przerwy między linią dzielącą a kolejnym tekstem
                const dividerGap = 3; // przesunięcie w punktach

                // Renderowanie drugiej linii tekstu z wykorzystaniem secondLineFontSize
                doc.font('Roboto').fontSize(secondLineFontSize);
                const secondLineArray = secondLimitedText.split('\n');
                currentY = dividerY + dividerGap;
                secondLineArray.forEach((line) => {
                    doc.text(line, x + padding, currentY, { lineBreak: false });
                    currentY += doc.heightOfString(line, { lineBreak: false });
                });
            });

            // Add header and footer to every page
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);

                const currentY = doc.y;
                const originalMargins = doc.page.margins;

                // Temporarily set margins to zero for header and footer placement
                doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };

                // Draw updated header (lowered by 4mm)
                doc.fontSize(10)
                    .font('Roboto-Bold')
                    .text(headerText, leftMargin, 10 + mmToPt(3), {
                        align: 'center',
                        width: doc.page.width - leftMargin - rightMargin
                    });

                // Draw updated footer (raised by 4mm)
                doc.fontSize(10)
                    .font('Roboto')
                    .text(`Page ${i + 1} of ${range.count}`, 0, doc.page.height - 40 + 10, {
                        align: 'center',
                        width: doc.page.width
                    });

                // Restore original margins and y position
                doc.page.margins = originalMargins;
                doc.y = currentY;
            }

            // Finalize PDF document
            doc.end();
            const fileName = `etykiety_${safeFileName(translations[mealType])}_${fileNameDate}.pdf`
            return returnPdfForFront({ pdfPromise, fileName });
        } catch (error) {
            console.error('Error generating labels PDF:', error);
            throw error;
        }
    });

export default labelsPdf;
