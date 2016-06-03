# feed-to-kindle
Pick any site's feed and compile it as an Epub for e-readers!

#Pre-requisites
- Environment Variables
  PARSER_ARTICLE -> InstaParser Article API URL
  PARSER_KEY -> InstaParser API Key
  
#Usage
node app.js --url <feedUrl> [optional] --cutoff <yyyy-mm-dd> --file <filename>
