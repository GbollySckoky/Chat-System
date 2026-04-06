it's use to generate secret key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
