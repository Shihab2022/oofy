import { Router } from 'express';
import { prisma } from '../../../lib/prisma';
import { sendMail } from '../../../lib/mail';
import { contactEmailHtml } from '../../../lib/email-templates';
import { env } from '../../../lib/env';
import { validateBody } from '../../../middleware/validate';
import { asyncHandler } from '../../../middleware/error';
import { ContactSchema } from '@oofy/shared';

const router = Router();

router.post(
  '/',
  validateBody(ContactSchema),
  asyncHandler(async (req, res) => {
    const message = await prisma.contactMessage.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        message: req.body.message,
      },
    });

    // Notify the company (best effort — never fails the request).
    try {
      await sendMail({
        to: env.COMPANY_EMAIL,
        subject: `New contact message from ${message.name}`,
        html: contactEmailHtml(message),
        type: 'CONTACT',
      });
    } catch (err) {
      console.error('[mail] Contact notification error:', err);
    }

    res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been sent.',
      data: { id: message.id },
    });
  }),
);

export { router as contactRouter };
