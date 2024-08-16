const { v4: uuidv4 } = require('uuid');
const Iyzipay = require('iyzipay');
const Response = require('../../utils/response');
const payment = require('./paymentModel');

// Iyzipay Kart Listeleme Fonksiyonu
function cardListpayment(iyzipay, cardUserKey) { 
    return new Promise((resolve, reject) => {
        iyzipay.cardList.retrieve({ cardUserKey }, (err, result) => {
            if (err || result.status !== "success") {
                return reject(err || result);
            }
            resolve(result);
        });
    });
}


// Ödeme Sonuçlarını Veritabanına Kaydetme Fonksiyonu
async function savePaymentToDatabase(sendData, resultData) {
    const payment_Info = new payment({
        sendData: sendData,
        resultData: resultData
    });
    await payment_Info.save();
}

// Ödeme Yapma Fonksiyonu
const addPayment = async (req, res) => {
    const id = uuidv4();
    console.log("id: ", id);

    let iyzipay = new Iyzipay({
        apiKey: process.env.PAYMENT_API_KEY,
        secretKey: process.env.PAYMENT_SECRET_KEY,
        uri: 'https://sandbox-api.iyzipay.com'
    });

    const { price, cardUserName, cardNumber, expireDate, cvc, registerCard, cardToken, cardUserKey, isSave } = req.body;

    let data = {
        locale: "tr",
        conversationId: id,
        price: price,
        paidPrice: price,
        currency: "TRY",
        installment: '1',
        paymentGroup: "PRODUCT",
        buyer: {
            id: 'BY789',
            name: 'John',
            surname: 'Doe',
            gsmNumber: '+905350000000',
            email: 'john.doe@iyzico.com',
            identityNumber: '74300864791',
            lastLoginDate: '2015-10-05 12:43:35',
            registrationDate: '2013-04-21 15:12:09',
            registrationAddress: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
            ip: '85.34.78.112',
            city: 'Istanbul',
            country: 'Turkey',
            zipCode: '34732'
        },
        shippingAddress: {
            contactName: 'Jane Doe',
            city: 'Istanbul',
            country: 'Turkey',
            address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
            zipCode: '34742'
        },
        billingAddress: {
            contactName: 'Jane Doe',
            city: 'Istanbul',
            country: 'Turkey',
            address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
            zipCode: '34742'
        },
        basketItems: [
            {
                id: 'BI101',
                name: 'Binocular',
                category1: 'Collectibles',
                itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
                price
            },
        ]
    };

    if (isSave === true && cardToken && cardUserKey) {
        data.paymentCard = {
            cardToken,
            cardUserKey
        };
    } else if (isSave === false) {
        data.paymentCard = {
            cardHolderName: cardUserName,
            cardNumber,
            expireMonth: expireDate.split("/")[0],
            expireYear: "20" + expireDate.split("/")[1],
            cvc,
            registerCard
        };
    }

    try {
        const result = await new Promise((resolve, reject) => {
            iyzipay.payment.create(data, (err, result) => {
                if (err || result.status !== "success") {
                    return reject(new Response(err, "Ödeme Başarısız!").error400(res));
                }
                resolve(result);
            });
        });

        await savePaymentToDatabase(data, result); // Ödeme sonuçlarını veritabanına kaydet

        new Response(result, "Ödeme Başarılı").success(res);
    } catch (error) {
        console.error(error);
    }
};

// Kart Listeleme Fonksiyonu
const card_List = async (req, res) => {
    const { cardUserKey } = req.body;

    let iyzipay = new Iyzipay({
        apiKey: process.env.PAYMENT_API_KEY,
        secretKey: process.env.PAYMENT_SECRET_KEY,
        uri: 'https://sandbox-api.iyzipay.com'
    });

    try {
        const result = await cardListpayment(iyzipay, cardUserKey);

        result.cardDetails.map((item) => {
            item.cardUserKey = cardUserKey;
        });

        console.log("yapılan işlem :", result);
        new Response(result.cardDetails, "Liste getirildi").success(res);
    } catch (error) {
        console.log(error);
        new Response(error, "Liste Getirilemedi!").error400(res);
    }
};

// Kart Kaydetme Fonksiyonu
const cardSave = async (req, res) => {
    const { cardAlias, cardUsername, cardNumber, expireDate, email, cardUserKey } = req.body;

    let iyzipay = new Iyzipay({
        apiKey: process.env.PAYMENT_API_KEY,
        secretKey: process.env.PAYMENT_SECRET_KEY,
        uri: 'https://sandbox-api.iyzipay.com'
    });

    const data = {
        locale: "tr",
        email: email,
        cardUserKey: cardUserKey || undefined, // cardUserKey yoksa undefined bırakılacak
        card: {
            cardAlias: cardAlias,
            cardHolderName: cardUsername,
            cardNumber: cardNumber,
            expireMonth: expireDate.split("/")[0],
            expireYear: "20" + expireDate.split("/")[1]
        }
    };

    try {
        const result = await new Promise((resolve, reject) => {
            iyzipay.card.create(data, (err, result) => {
                if (err || result.status !== "success") {
                    return reject(new Response(err, "Kart Kaydedilemedi!").error400(res));
                }
                resolve(result);
            });
        });

        new Response(result, "Kart kaydedildi").success(res);
    } catch (error) {
        console.error(error);
        new Response(error, "Kart Kaydedilemedi!").error400(res);
    }
};


// Kart Silme Fonksiyonu
const cardDelete = async (req, res) => {
    const { cardToken, cardUserKey } = req.body;

    let iyzipay = new Iyzipay({
        apiKey: process.env.PAYMENT_API_KEY,
        secretKey: process.env.PAYMENT_SECRET_KEY,
        uri: 'https://sandbox-api.iyzipay.com'
    });

    try {
        const result = await new Promise((resolve, reject) => {
            iyzipay.card.delete({
                locale: "tr",
                cardUserKey: cardUserKey,
                cardToken: cardToken
            }, (err, result) => {
                if (err || result.status !== "success") {
                    return reject(new Response(err, "Kart silinmedi veya kart yok!").error400(res));
                }
                resolve(result);
            });
        });

        new Response(result, "Kart silindi").success(res);
    } catch (error) {
        console.error(error);
    }
};

module.exports = {
    addPayment,
    card_List,
    cardSave,
    cardDelete
};
