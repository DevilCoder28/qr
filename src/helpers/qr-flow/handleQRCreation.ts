import logger from '../../config/logger';
import { uploadToCloudinary } from '../../config/uploadToCloudinary';
import { QRMetaData } from '../../models/qr-flow/newQRTypeModel';
import { INewQRTypeSchema } from '../../validators/qr-flow/newQRTypeSchema';

const uploadField = async (
  files: Record<string, Express.Multer.File[]>,
  folderPath: string,
  fieldName: string,
  resourceType: 'image' | 'raw' = 'image',
) => {
  const file = files?.[fieldName]?.[0];
  if (!file) return undefined;
  const result: any = await uploadToCloudinary(
    file.buffer,
    folderPath,
    resourceType,
  );
  return result.secure_url;
};

export const handleQRTypeCreation = async (
  data: INewQRTypeSchema,
  files: Record<string, Express.Multer.File[]>,
) => {
  const folderPath = `qr_types/${data.qrName.replace(/\s+/g, '_')}`;
  const qrBackgroundImage = await uploadField(
    files,
    folderPath,
    'qrBackgroundImage',
  );
  const qrIcon = await uploadField(files, folderPath, 'qrIcon');
  const productImage = await uploadField(files, folderPath, 'productImage');
  const pdfTemplate = await uploadField(
    files,
    folderPath,
    'pdfTemplate',
    'raw',
  );

  const enrichedProfessions = await Promise.all(
    (data.professionsAllowed || []).map(async (prof) => {
      const fieldKey = `logo_${prof.name}`;
      if (files?.[fieldKey]?.[0]) {
        const uploaded: any = await uploadToCloudinary(
          files[fieldKey][0].buffer,
          `${folderPath}/professions`,
        );
        return {
          ...prof,
          logoUrl: uploaded.secure_url,
        };
      }
      return prof;
    }),
  );

  const newQRType = await QRMetaData.create({
    ...data,
    qrBackgroundImage,
    qrIcon,
    productImage,
    pdfTemplate,
    professionsAllowed: enrichedProfessions,
  });
  return newQRType;
};
