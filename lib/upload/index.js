const _ = process.env;
const formidable = require("formidable"),
  path = require("path"),
  { existsSync, mkdirSync } = require("fs"),
  os = require("os");
const {
  getFileExt,
  checkFileFolderPermision,
  validateFileExtensions,
} = require("../fn/fn.checker");

// Upload Callback
const upload = (
  _req,
  _path,
  callback,
  options = {
    keep_filename: false,
    keep_extention: true,
    create_dir_ifnot_exist: true,
    allowed_ext: ["*"],
  }
) => {
  // Prepaire Directory
  const folder = path.join("public/uploads", _path);
  if (!existsSync(folder)) {
    mkdirSync(folder, {
      recursive: Boolean(options.create_dir_ifnot_exist),
    });
  }
  const form = new formidable.IncomingForm();
  form.uploadDir = os.tmpdir(); // Upload to Temporary Directory
  form.keepExtensions = Boolean(options.keep_extention);

  checkFileFolderPermision(form.uploadDir, ["W_OK"], (tmp_err, tmp_stat) => {
    if (tmp_err)
      return callback(
        new Error(`Directory is Not Writeable ${form.uploadDir}`)
      );
    else if (tmp_stat) {
      checkFileFolderPermision(folder, ["W_OK"], (err, stat) => {
        if (err)
          return callback(
            new Error(`Directory is Not Writeable ${form.uploadDir}`)
          );
        else if (stat) {
          const checkValidFile = (strName, fileObj) => {
            return validateFileExtensions(strName, options.allowed_ext);
          };

          form
            .on("error", (err) => {
              if (err.code !== 1002)
                console.error("[ formidable ] Request Error", err, form);
            })

            .on("aborted", () => {
              console.warn("[ formidable ] Request Aborted", form);
            })

            .on("field", (field, value) => {
              console.log("Field Event", field, value);
            })

            .on("fileBegin", (name, file) => {
              if (checkValidFile(name, file)) {
                // Move file to proper directory
                const file_ext = getFileExt(name);
                let newFilename = Boolean(options.keep_filename)
                  ? name
                  : `${file.newFilename}.${file_ext}`;
                file.filepath = path.join(folder, newFilename);
              }
            })

            .on("file", (name, file) => {
              //On file received
              if (checkValidFile(name, file)) {
                file.ok = true;
                console.log("Received File", name, file);
              } else console.warn("TMP Received File", name, file);
            })

            .on("progress", (bytesReceived, bytesExpected) => {
              //self.emit('progess', bytesReceived, bytesExpected)
              var percent = ((bytesReceived / bytesExpected) * 100) | 0;
              if (!_.NODE_ENV || _.NODE_ENV != "production")
                process.stdout.write(
                  `Uploading: ${percent}% ${bytesReceived}/${bytesExpected}\r`
                );
            })

            .on("end", () => {
              // console.log("Done");
            });

          form.parse(_req, (err, fields, files) => {
            return callback(err, fields, files);
          });
        }
      });
    }
  });
};

module.exports = {
  /**
   *
   * @param { Request } _req request
   * @param { String } _path path to save the upload
   * @param { Function } callback callback function
   * @returns callback(error, fields, files)
   */
  service_upload: upload,
};
