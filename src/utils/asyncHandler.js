const asyncHandler = (reqHandler) => {
    return async (req, res , next) =>{
        Promise.resolve(reqHandler(req,res,next))
        .catch((err) => next(err));
    }
}
