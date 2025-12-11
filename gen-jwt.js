import CryptoJS from './crypto-js.js';

function base64UrlEncode(str) {
    var encodedSource = CryptoJS.enc.Base64.stringify(str);
    var reg = new RegExp('/', 'g');
    // 匹配 末尾连续的=号 并 替换为空字符串，再匹配 所有+字符 并 替换为-字符，最后匹配 所有/字符 并 替换为_字符
    encodedSource = encodedSource.replace(/=+$/,'').replace(/\+/g,'-').replace(reg,'_');
    return encodedSource;
}

export function generateJWT(payload, secretSalt) {
    // Implement JWT generation logic here
    let header = JSON.stringify({
        "alg": "HS256",
        "typ": "JWT"
    })

    let before_sign = base64UrlEncode(CryptoJS.enc.Utf8.parse(header)) + '.' + base64UrlEncode(CryptoJS.enc.Utf8.parse(payload));
    let signature = CryptoJS.HmacSHA256(before_sign, secretSalt);
    signature = base64UrlEncode(signature);
    let final_sign = before_sign + '.' + signature;
    return final_sign;
}

function parseJWT(part) {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/'); // 替换Base64字符
    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    );
    return JSON.parse(jsonPayload); // 返回JSON对象
}

export function verifyJWT(token, secretSalt) {
    // Implement JWT verification logic here
    let parts = token.split('.');
    if (parts.length !== 3) {
        return {
            valid: false
        };
    }
    let header = parseJWT(parts[0]);
    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
        return {
            valid: false
        };
    }
    let payload = parseJWT(parts[1]);
    let iat = payload.iat;
    let exp = payload.exp;
    let now = new Date().getTime();
    if (now < iat || now > exp) {
        return {
            valid: false,
            message: '过期的 Token'
        };
    }
    let before_sign = parts[0] + '.' + parts[1];
    let signature = base64UrlEncode(CryptoJS.HmacSHA256(before_sign, secretSalt));
    return {
        valid: signature === parts[2],
        payload: payload
    };
}

export function hash(password, salt) {
    const hash = CryptoJS.HmacSHA256(password, salt);
    return CryptoJS.enc.Hex.stringify(hash);
}