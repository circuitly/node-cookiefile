/**
 * Created by horat1us on 09.10.16.
 */
"use strict";
module.exports = {
    Cookie: class Cookie {
        constructor({domain, crossDomain = false, path = '/', https = false, expire = 0, name, value}) {
            if (!(expire instanceof Date || require('isnumeric')(expire))) {
                throw new module.exports.CookieError();
            }
            this.domain = domain;
            this.crossDomain = crossDomain;
            this.path = path;
            this.https = https;
            this.expire = parseFloat(expire);
            this.value = value;
            this.cookieName = name;
        }

        /** @return {String} */
        get name() {
            return this.cookieName;
        }

        get isCrossDomain() {
            return this.crossDomain.toString().toUpperCase();
        }

        get isHttps() {
            return this.https.toString().toUpperCase();
        }

        /** @return {String} */
        toString() {
            let _this = this,
                string = '';
            ['domain', 'isCrossDomain', 'path', 'isHttps', 'expire', 'name', 'value']
                .forEach(prop => string += _this[prop] + '\t');
            return string.trim() + '\n';
        }

        /**
         * @param {Cookie} cookie
         * @return {Boolean}
         */
        is(cookie) {
            for (let prop in ['domain', 'crossDomain', 'path', 'https', 'expire', 'name', 'value']) {
                if (this[prop] !== cookie[prop]) {
                    return false;
                }
            }
            return true;
        }
    },
    CookieMap: class CookieMap extends Map {
        constructor(file = []) {
            if (Array.isArray(file)) {
                super();
                file.forEach(cookie => {
                    if (!(cookie instanceof module.exports.Cookie)) {
                        throw new module.exports.CookieError(4);
                    }
                    this.set(cookie);
                });
                this.file = false;
            } else if (typeof(file) === 'string') {
                super();
                this.file = file;
                return this.readFile();
            } else {
                throw new TypeError("Wrong argument supplied for CookieMap construtor");
            }
        }

        /**
         * @param {Cookie} cookie
         * @return {CookieMap}
         */
        set(cookie) {
            if (!(cookie instanceof module.exports.Cookie)) {
                throw new TypeError(`Cookie must be type of cookie, ${typeof(cookie)} given`);
            }
            super.set(cookie.name, cookie);

            return this;
        }

        /**
         * @return {CookieMap}
         */
        save(file = false) {
            if (file === false || typeof(file) !== 'string') {
                file = this.file;
            }
            if (file === false) {
                throw new module.exports.CookieError(2);
            }

            require('fs').writeFileSync(file, this.toString());

            return this;
        }

        toString() {
            let cookieContent = module.exports.CookieFile.Header;

            /** @var {Cookie} cookie */
            for (let cookie of this.values()) {
                cookieContent += cookie.toString();
            }

            return cookieContent.trim();
        }


        /**
         * @return {CookieMap}
         */
        readFile() {
            if (!require('file-exists')(this.file)) {
                throw new module.exports.CookieError(1);
            }
            const fs = require('fs');
            let cookieFileContents = fs.readFileSync(this.file, {encoding: 'UTF-8'})

            const cookies = cookieFileContents
                .split('\n')
                .map(line => line.split("\t").map((word) => word.trim()))
                .filter(line => line.length === 7)
                .map(cookieData => new module.exports.Cookie({
                    name: cookieData[5],
                    value: cookieData[6],
                    domain: cookieData[0],
                    crossDomain: cookieData[1] === 'TRUE',
                    path: cookieData[2],
                    https: cookieData[3] === 'TRUE',
                    expire: parseFloat(cookieData[4]),
                }));

            cookies.forEach(cookie => this.set(cookie));

            return this;
        }


        get size() {
            return super.size;
        }
    },
    CookieError: class CookieError extends Error {
        constructor(code = 0) {
            const message = (() => {
                switch (code) {
                    case 4:
                        return "Cookie passed to constructor is incorrect";
                    case 3:
                        return "Cookie file writing error";
                    case 2:
                        return 'You can not save this object because is initialized by Map, not file';
                    case 1:
                        return 'Cookie File doesn\'t exists';
                    default:
                        return "Cookie expire must be instance of Date or integer";
                }
            })();

            super(message);
        }
    }
    ,
    CookieFile: {
        Header: `# Netscape HTTP Cookie File
# https://curl.haxx.se/docs/http-cookies.html
# This file was generated by node-httpcookie! Edit at your own risk

`,
    }
}
;