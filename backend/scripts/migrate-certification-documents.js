/**
 * Mueve los comprobantes que quedaron en la carpeta pública uploads/ a
 * private-uploads/certifications/<userId>/ y guarda solo el nombre del archivo.
 * Hasta ejecutarlo, esos archivos siguen accesibles por su URL pública.
 * Se ejecuta desde backend/ y se puede repetir sin riesgo:
 *
 *   npm run migrate:cert-docs            -> solo informa qué haría
 *   npm run migrate:cert-docs -- --apply -> aplica los cambios
 */
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');

const LEGACY_PREFIX = '/uploads/';

function readEnvValue(name) {
  const line = fs
    .readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .find((candidate) => candidate.startsWith(`${name}=`));
  return line?.slice(name.length + 1).trim();
}

async function main() {
  const apply = process.argv.includes('--apply');
  const uri = readEnvValue('MONGO_URI_USERS');
  if (!uri) throw new Error('.env debe tener MONGO_URI_USERS.');

  await mongoose.connect(uri);
  const profiles = mongoose.connection.collection('caregiverprofiles');
  const stats = { profiles: 0, moved: 0, missing: 0 };

  for await (const profile of profiles.find({
    certification_documents: { $regex: `^${LEGACY_PREFIX}` },
  })) {
    stats.profiles += 1;
    const targetDir = path.join(
      'private-uploads',
      'certifications',
      String(profile.user_id),
    );
    const documents = [];

    for (const document of profile.certification_documents) {
      if (!document.startsWith(LEGACY_PREFIX)) {
        documents.push(document);
        continue;
      }
      const filename = path.basename(document);
      const source = path.join('uploads', filename);
      if (!fs.existsSync(source)) {
        // Si ya se movió en una ejecución cortada, se conserva la referencia.
        if (fs.existsSync(path.join(targetDir, filename))) {
          documents.push(filename);
        } else {
          stats.missing += 1;
          console.warn(`Sin archivo, se quita del perfil: ${document}`);
        }
        continue;
      }
      stats.moved += 1;
      documents.push(filename);
      if (apply) {
        fs.mkdirSync(targetDir, { recursive: true });
        fs.renameSync(source, path.join(targetDir, filename));
      }
    }

    if (apply) {
      await profiles.updateOne(
        { _id: profile._id },
        { $set: { certification_documents: documents } },
      );
    }
  }

  console.log(stats);
  if (!apply) {
    console.log('Modo informe: no se cambió nada. Para aplicar agregá --apply.');
  }
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
