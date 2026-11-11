import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const uploadProductImage = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    if (
      !env.CLOUDINARY_CLOUD_NAME ||
      !env.CLOUDINARY_API_KEY ||
      !env.CLOUDINARY_API_SECRET
    ) {
      throw new ApiError(
        503,
        "Cloudinary is not configured. Add Cloudinary credentials to the backend .env file.",
      );
    }
    if (!req.file) throw new ApiError(400, "Choose an image to upload");
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "oofy/products";
    const signature = crypto
      .createHash("sha1")
      .update(
        `folder=${folder}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`,
      )
      .digest("hex");
    const form = new FormData();
    form.append(
      "file",
      new Blob([Uint8Array.from(req.file.buffer)], { type: req.file.mimetype }),
      req.file.originalname,
    );
    form.append("api_key", env.CLOUDINARY_API_KEY);
    form.append("timestamp", String(timestamp));
    form.append("folder", folder);
    form.append("signature", signature);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: form },
    );
    const data = (await response.json()) as {
      secure_url?: string;
      public_id?: string;
      error?: { message?: string };
    };
    if (!response.ok || !data.secure_url)
      throw new ApiError(
        502,
        data.error?.message || "Cloudinary upload failed",
      );
    res.status(201).json({
      success: true,
      data: { url: data.secure_url, publicId: data.public_id },
    });
  },
);
