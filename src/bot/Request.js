import got from 'got';
import {createHash} from 'crypto';

export default class Request {

    request;

    /**
     * @type {String}
     */
    response;

    /**
     * parsed JSON response
     * @type {Object}
     */
    JSON;

    constructor(url, options = {}) {
        this.url = url;
        this.options = options;
    }

    /**
     * get raw data
     * @return {Promise<Request>}
     */
    async get() {
        this.request = await got.get(this.url, this.options);
        this.response = this.request.body.toString();
        return this;
    }

    /**
     * get JSON data and parse it
     * @return {Promise<Request>}
     */
    async getJSON() {
        await this.get();
        try {
            this.JSON = JSON.parse(this.response);
        }
        catch (e) {
            throw new Error(`Failed to parse JSON response of ${this.url}`);
        }
        return this;
    }

    /**
     * request this url and return a sha256 hash of the raw body
     * @return {Promise<string>}
     */
    async getHash() {
        const response = await got.get(this.url, this.options);
        return createHash('sha256').update(new DataView(response.rawBody.buffer)).digest('hex').toString();
    }
}
