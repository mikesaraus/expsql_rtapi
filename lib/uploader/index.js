const formidable = require('formidable'),
  path = require('path'),
  { existsSync, mkdirSync } = require('fs'),
  { log_dirs } = require('../data/db.structures'),
  { getFileExt, checkFileFolderPermision, validateFileExtensions } = require('../fn/fn.checker')

/**
 * @typedef {Object} UploaderOptions            Options for uploading
 * @property {Boolean} keep_filename            To keep filename of uploaded files
 * @property {Boolean} keep_extention           To keep file extentions
 * @property {Boolean} create_dir_ifnot_exist   To force create dir if not exist
 * @property {String[]} allowed_ext             List of file extensions to allow
 */

/**
 *
 * @param {Request} _req                    Request
 * @param {String} _path                    Path to save the upload
 * @param {Function} callback               Callback function
 * @param {UploaderOptions} options         Options for uploading
 * @callback callback
 */
const upload = (
  _req,
  _path,
  callback,
  options = {
    keep_filename: false,
    keep_extention: true,
    create_dir_ifnot_exist: true,
    allowed_ext: ['*'],
  }
) => {
  const form = new formidable.IncomingForm()
  form.uploadDir = path.join(log_dirs.main, log_dirs.upload) // Upload to Temporary Directory
  form.keepExtensions = Boolean(options.keep_extention)

  // Prepaire Directories
  const folder = path.join('public/uploads', _path)
  if (!existsSync(folder)) {
    mkdirSync(folder, {
      recursive: Boolean(options.create_dir_ifnot_exist),
    })
  }
  if (!existsSync(form.uploadDir)) {
    mkdirSync(form.uploadDir, {
      recursive: Boolean(options.create_dir_ifnot_exist),
    })
  }
  checkFileFolderPermision(form.uploadDir, ['W_OK'], (tmp_err, tmp_stat) => {
    if (tmp_err) return callback(new Error(`Directory is Not Writeable ${form.uploadDir}`))
    else if (tmp_stat) {
      checkFileFolderPermision(folder, ['W_OK'], (err, stat) => {
        if (err) return callback(new Error(`Directory is Not Writeable ${folder}`))
        else if (stat) {
          const checkValidFile = (strName, fileObj) => {
            return validateFileExtensions(strName, options.allowed_ext)
          }

          form
            .on('error', (err) => {
              if (err.code !== 1002)
                console.error('[ formidable ] Request Error', JSON.stringify(err), JSON.stringify(form))
            })

            .on('aborted', () => {
              console.warn('[ formidable ] Request Aborted', JSON.stringify(form))
            })

            .on('field', (field, value) => {
              console.log('Field Event', field, value)
            })

            .on('fileBegin', (name, file) => {
              if (checkValidFile(name, file)) {
                // Move file to proper directory
                const file_ext = getFileExt(name)
                let newFilename = Boolean(options.keep_filename) ? name : `${file.newFilename}.${file_ext}`
                file.filepath = path.join(folder, newFilename)
              }
            })

            .on('file', (name, file) => {
              //On file received
              if (checkValidFile(name, file)) {
                file.ok = true
                console.log('Received File', name, JSON.stringify(file))
              } else console.warn('TMP Received File', name, JSON.stringify(file))
            })

            .on('progress', (bytesReceived, bytesExpected) => {
              //self.emit('progess', bytesReceived, bytesExpected)
              var percent = ((bytesReceived / bytesExpected) * 100) | 0
              if (!process.env.NODE_ENV || process.env.NODE_ENV != 'production')
                process.stdout.write(`Receiving: ${percent}% ${bytesReceived}/${bytesExpected}\r`)
            })

            .on('end', () => {
              // console.log("Done");
            })

          form.parse(_req, (err, fields, files) => {
            return callback(err, fields, files)
          })
        }
      })
    }
  })
}

module.exports = {
  service_upload: upload,
}
