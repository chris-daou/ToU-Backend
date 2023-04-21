const cheerio = require('cheerio');
const request = require('request');


module.exports.getRate_get = async (req, res) => {
    try{
    const options = {
        url: "https://lirarate.org/",
        gzip: true,
      };
      request(options, function(err, res, html){
        let $ = cheerio.load(html);
        
        const buyrate = $("p[id='latest-buy']").text().trim();
        const rate = buyrate.replace(/\D/g, '').substring(1);
        
        console.log(rate);
        res.send({rate});
        });
    }
    catch(err){
        console.log(err);
        res.status(400).send({ error: 'Error Occured' });
    }
}