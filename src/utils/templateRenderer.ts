import fs from 'fs';
import path from 'path';
import { htmlToText } from 'html-to-text';
import handlebars from 'handlebars';
import { MailTemplate } from '../enums/enums';
import { TEMPLATE_DIR } from '../config/constants';

export const renderTemplate = async (
  template: MailTemplate,
  data: object,
): Promise<{ html: string; text: string }> => {
  const templatePath = path.join(TEMPLATE_DIR, `${template}.html`);
  const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
  const compiledTemplate = handlebars.compile(templateContent);
  const html = compiledTemplate(data);
  const text = htmlToText(html);
  return { html, text };
};
