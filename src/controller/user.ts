import { Request, Response } from "express";

const authorize = (req: Request, res: Response) => {
    try {
        const { hash } = req.body
        console.log('authorize', hash, req.body);
        

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}