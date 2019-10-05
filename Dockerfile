FROM node:12

WORKDIR /usr/src/app
COPY package*.json ./

ENV TOKEN=NTc1MDAxNzg3NjQ0MjQ4MDg1.XXBYug.6Np_tVDoileAkRHeyG1enIn6oMo
ENV GOOGLE_ID=369875007409-dv72vmnerkdkalhbidncruf6lsnak8a7.apps.googleusercontent.com
ENV GOOGLE_SECRET=5bLOLY555GplRyo75Da1R7vh
ENV REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob
ENV API_URL=http://localhost:5000

RUN npm install
COPY . .
CMD [ "node", "index.js" ]