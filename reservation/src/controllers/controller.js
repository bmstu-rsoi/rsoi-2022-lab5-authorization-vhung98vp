const axios = require('axios');
const Reservation = require('../models/reservation');
const PORT = process.env.PORT || 8080;
const GATEWAY_URL = (process.env.GATEWAY_URL || 'http://localhost:' + PORT)

class ReservationController {
    static getReservationsByUsername = async(req, res, next) => {
        let username = req.headers['x-user-name'];
        let authHeader = req.headers['authorization'];
        const reservations = await Reservation.findAll({where: {username}});
        let items = [];
        for (const item of reservations){
            let libResp = await axios.get(GATEWAY_URL + '/api/v1/libraries/' + item.library_uid, {headers: {'authorization': authHeader}});
            let bookResp = await axios.get(GATEWAY_URL + '/api/v1/books/' + item.book_uid, {headers: {'authorization': authHeader}});
            items.push({
                reservationUid: item.reservation_uid,
                status: item.status,
                startDate: item.start_date.toISOString().slice(0, 10),
                tillDate: item.till_date.toISOString().slice(0, 10),
                book: bookResp.data,
                library: libResp.data
            });
        }
        return res.status(200).json(items);
    }

    static takeBook = async(req, res, next) => {
        let username = req.headers['x-user-name'];
        let authHeader = req.headers['authorization'];
        let {bookUid, libraryUid, tillDate} = req.body;
        try{
            let rentedTotal = await Reservation.count({where: {username, status: 'RENTED'}});
            let ratingResp = await axios.get(GATEWAY_URL + '/api/v1/rating', {headers: {'authorization': authHeader}})
            let stars = ratingResp.data.stars;
            console.log('Stars: '+ stars)
            if (stars > rentedTotal){
                try {
                    await axios.patch(GATEWAY_URL + '/api/v1/books/' + bookUid, {rent: true}, {headers: {'authorization': authHeader}});
                    const MODEL = {
                        username: username,
                        book_uid: bookUid,
                        library_uid: libraryUid,
                        status: 'RENTED',
                        start_date: new Date(),
                        till_date: tillDate
                    };
                    const reservation = await Reservation.create(MODEL);
                    let libResp = await axios.get(GATEWAY_URL + '/api/v1/libraries/' + libraryUid, {headers: {'authorization': authHeader}});
                    let bookResp = await axios.get(GATEWAY_URL + '/api/v1/books/' + bookUid, {headers: {'authorization': authHeader}});
                    let resObj = {
                        reservationUid: reservation.reservation_uid,
                        status: reservation.status,
                        startDate: reservation.start_date.toISOString().slice(0, 10),
                        tillDate: reservation.till_date.toISOString().slice(0, 10),
                        book: bookResp.data,
                        library: libResp.data
                    }
                    return res.status(200).json(resObj);
                } catch (error) {
                    return res.status(400).json({ message: 'Data validation error'})
                }
            } else {
                return res.status(400).json({ message: 'Data validation error'})
            }
        } catch (e) {
            return res.status(400).json({message: e})
        }
        
        
    }

    static returnBook = async(req, res, next) => {
        let username = req.headers['x-user-name'];
        let authHeader = req.headers['authorization'];
        let reservation_uid = req.params.reservationUid;
        let {condition, date} = req.body;
        let reservation = await Reservation.findOne({where: {username, reservation_uid}});
        if(reservation){
            let starChange = 0;
            if(date > reservation.till_date){
                reservation.status = 'EXPIRED';
                starChange -= 10;
            } else {
                reservation.status = 'RETURNED';
                starChange += 1;
            }            
            await Reservation.update({status: reservation.status}, { where: { id: reservation.id} });

            let bookResp = await axios.get(GATEWAY_URL + '/api/v1/books/' + reservation.book_uid, {headers: {'authorization': authHeader}});
            let conditionBefore = bookResp.data.condition;
            if(condition != conditionBefore) {
                starChange -= 10;
                if (reservation.status = 'RETURNED') {
                    starChange -= 1;
                }
            }
            
            await axios.patch(GATEWAY_URL + '/api/v1/books/' + reservation.book_uid, {rent: false, condition}, {headers: {'authorization': authHeader}});
            await axios.patch(GATEWAY_URL + '/api/v1/rating', {stars: starChange}, {headers: {'authorization': authHeader}});
            return res.status(204).json();            
        } else {
            return res.status(404).json({message: "Reservation not found"});
        }
        
    }

}

module.exports = ReservationController;