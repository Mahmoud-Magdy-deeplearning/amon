module.exports = () => async (ctx, next) => {
  ctx.response.set('referrer-policy', 'no-referrer');
  ctx.response.set('x-content-type-options', 'nosniff');
  ctx.response.set('x-frame-options', 'DENY');
  ctx.response.set('content-security-policy', "default-src 'self' https:");
  ctx.response.set('x-xss-protection', '1; mode=block');
  ctx.response.set('strict-transport-security', 'max-age=2592000; includeSubDomains');

  return next();
};
