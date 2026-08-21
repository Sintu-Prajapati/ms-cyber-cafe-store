function deliveryAuth(req, res, next) {

    if (!req.session.deliveryPersonId) {

        return res.redirect(
            "/delivery/login"
        );

    }

    next();
}

module.exports = deliveryAuth;