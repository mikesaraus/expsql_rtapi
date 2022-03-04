const _ = process.env,
  { sign, verify } = require("jsonwebtoken"),
  { errorJsonResponse } = require("../lib/fn/fn.db");

module.exports = {
  signToken: (
    data,
    token_expiry = _.TOKEN_LOGIN_EXPIRE,
    token_key = _.TOKEN_KEY,
    public = false
  ) => {
    token_key = public ? _.TOKEN_KEY_PUB : token_key ? token_key : _.TOKEN_KEY;
    if (data && typeof data === "object")
      return token_expiry
        ? {
            bearertoken: sign({ data }, token_key, {
              expiresIn: token_expiry || _.TOKEN_LOGIN_EXPIRE,
            }),
            expires: token_expiry || _.TOKEN_LOGIN_EXPIRE,
          }
        : {
            bearertoken: sign({ data }, token_key),
            expires: token_expiry || _.TOKEN_LOGIN_EXPIRE,
          };
  },

  verifyToken: (req, res, next) => {
    let token = req.get("authorization");
    if (token) {
      token = token.split(" ")[1];
      verify(token, _.TOKEN_KEY, (err, decoded) => {
        if (err) {
          err.code = err.expiredAt ? -1 : undefined;
          console.error(
            err.expiredAt ? "Token is Expired" : "Invalid Token",
            "(Private Key)"
          );
          return res.json(
            errorJsonResponse({
              ...err,
              detail: err.expiredAt ? "Token is Expired" : "Invalid Token",
              code: -1,
            })
          );
        } else {
          req.headers.verified = decoded;
          console.log("Verified Token (Private Key):", { token, decoded });
          next();
        }
      });
    } else {
      return res.json(errorJsonResponse({ detail: "Access Denied" }));
    }
  },

  verifyPublicToken: (req, res, next) => {
    let token = req.get("authorization");
    if (token) {
      token = token.split(" ")[1];
      verify(token, _.TOKEN_KEY_PUB, (err, decoded) => {
        if (err) {
          console.error(
            err.expiredAt ? "Token is Expired" : "Invalid Token",
            "(Public Key)"
          );
          return res.json(
            errorJsonResponse({
              ...err,
              detail: err.expiredAt ? "Token is Expired" : "Invalid Token",
            })
          );
        } else {
          req.headers.verified = decoded;
          console.log("Verified Token (Public Key):", {
            token,
            decoded,
          });
          next();
        }
      });
    } else {
      return res.json(errorJsonResponse({ detail: "Access Denied" }));
    }
  },

  verifyPrivatePublicToken: (req, res, next) => {
    let token = req.get("authorization");
    if (token) {
      token = token.split(" ")[1];
      verify(token, _.TOKEN_KEY, (err, decoded) => {
        if (err) {
          verify(token, _.TOKEN_KEY_PUB, (err, decoded) => {
            if (err) {
              console.error(
                err.expiredAt ? "Token is Expired" : "Invalid Token"
              );
              return res.json(
                errorJsonResponse({
                  ...err,
                  detail: err.expiredAt ? "Token is Expired" : "Invalid Token",
                })
              );
            } else {
              req.headers.verified = decoded;
              console.log("Verified Token (Public Key):", {
                token,
                decoded,
                pkey: "private",
              });
              next();
            }
          });
        } else {
          req.headers.verified = decoded;
          console.log("Verified Token (Private Key):", {
            token,
            decoded,
            pkey: "private",
          });
          next();
        }
      });
    } else {
      return res.json(errorJsonResponse({ detail: "Access Denied" }));
    }
  },

  verifyCBPrivatePublicToken: (token, callBack) => {
    if (token) {
      verify(token, _.TOKEN_KEY, (err, decoded) => {
        if (err) {
          verify(token, _.TOKEN_KEY_PUB, (err, decoded) => {
            if (err) {
              callBack({ ...err, detail: "Invalid Token" });
            } else {
              let result = { token, ...decoded, pkey: "public" };
              console.log("Verified Token (Public Key):", result);
              callBack(null, result);
            }
          });
        } else {
          let result = { token, ...decoded, pkey: "private" };
          console.log("Verified Token (Private Key):", result);
          callBack(null, result);
        }
      });
    } else {
      callBack({ detail: "No Token" });
    }
  },
};
