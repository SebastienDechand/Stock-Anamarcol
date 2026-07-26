import { Request, Response } from 'express';
import UserModel from '../../models/user.model';
import { validateUploadedFile, uploadToImgBB } from '../../utils/upload/upload.utils';
import { logEvent } from '../../utils/audit/audit.utils';
import { handleError } from '../../utils/response/response.utils';
import { validateObjectId } from '../../utils/validate/validate.utils';

export const uploadProfil = async (req: Request, res: Response): Promise<void> => {
  if (!validateUploadedFile(req, res)) return;
  if (!validateObjectId(req.body.userId, res)) return;

  const fileName = req.body.name + '.jpg';

  try {
    const pictureUrl = await uploadToImgBB(req.file!.buffer, fileName);

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.body.userId,
      { $set: { picture: pictureUrl } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    try {
      await logEvent('upload', 'user', req.body.userId, res.locals.user?.username, { pictureUrl });
    } catch (err) {
      console.error('Audit upload user error:', err);
    }

    res.json(updatedUser);
  } catch (err) {
    handleError(res, err, 'File upload or database update error:');
  }
};
