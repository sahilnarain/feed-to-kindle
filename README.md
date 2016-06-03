# feed-to-kindle
Pick any site's feed and compile it as an Epub for e-readers!

#Pre-requisites
The following environment variables need to be set - i) PARSER_ARTICLE - Instaparser Article API URL and ii) PARSER_KEY - Instaparser API Key
  
#Usage
node app.js --url <feedUrl> [optional] --cutoff <yyyy-mm-dd> --file <filename>
