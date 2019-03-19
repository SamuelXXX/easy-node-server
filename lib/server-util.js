'use strict'
var mime = require("./mime");
var fs=require("fs");
var serverConfig=require("./server-config");
var classRespHeader=require("./response-header");

var serverUtility =
{
    /**
     * Display request detail information
     * @param {*} request Incoming request message
     */
    displayRequest: function (request) {
        console.log("Receive request from " +request.connection.remoteAddress.toString().split(":")[3]+":"+ request.connection.remotePort + " for >>>>" + request.url);
    },
    
    /**
     * Parse request header range 
     * @param {string} rangeHeader range header read from request header
     * @param {number} fileSize target file size
     */
	parseHeaderRange:function(rangeHeader,fileSize){
        rangeHeader=rangeHeader.replace(" ","");
        var rangeHeaderPatt=/^bytes=(\d*-\d*)(,\d*-\d*)*$/i;
        if(!rangeHeaderPatt.test(rangeHeader))
        {
            console.error("Not a legal range header");
            return [];
        }
		var c=rangeHeader.split("=")[1];
		var rangeArray=c.split(",");
		var retArray=[];
		for(var i=0;i<rangeArray.length;i++)
		{
			var o={};
			var s=rangeArray[i].split("-")[0];
			var e=rangeArray[i].split("-")[1];

			o.start=s==""?fileSize-Number(e):Number(s);
			o.end=e==""?fileSize-1:Number(e);
			retArray.push(o);
		}
		return retArray;
    },

    /**
     * Response a html page relocated 
     * @param {*} res 
     * @param {string} pathName 
     */
    responseRelocatedHTMLPage:function(res,pathName,relocatedUrl){
        var resHeader=new classRespHeader();
        resHeader.pushHeader('Content-Type','text/html;charset=utf-8');
        resHeader.pushHeader('Location',relocatedUrl);
        res.writeHead(302, resHeader.header);
        res.end();
    },
    
    /**
     * Response a html page from appointed path 
     * @param {*} res 
     * @param {string} pathName 
     */
    responseHTMLPage:function(res,pathName){
        
        res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
        fs.readFile(pathName,function(err,data){
            if(err)
            {
                res.writeHead(500);
				res.end();
                return console.error(err);
            }
            res.write(data);
            res.end();
        });
    },

    /**
     * Response when page not found
     * @param {serverConfig} serverConfig 
     */
    responsePageNotFound:function(res,serverConfig)
	{
		var fileNotFoundFilePath=serverConfig.root+"/"+serverConfig.notFoundPageFile;
		res.writeHead(404);
		if(fs.existsSync(fileNotFoundFilePath))
		{
			serverUtility.responseHTMLPage(res,fileNotFoundFilePath);
		}
		else{
			res.end();
		}
    },
    
    /**
     * Response when requested content not found
     * @param {*} res 
     */
    responseContentNotFound:function(res)
	{
		res.writeHead(404);
		res.end();
	},

    /**
     * Response full non-html content from appointed path
     * @param {*} res 
     * @param {string} pathName 
     */
    responseFullContent:function(res,pathName){
        res.writeHead(200, mime.generateContentHeader(pathName));
		fs.readFile(pathName,function(err,data){
						if(err)
						{
							res.writeHead(500);
							res.end();
							return console.error(err);
						}
						res.write(data);
						res.end();
					}); 
    },

    /**
     * Response partial-content from appointed path
     * @param {*} res 
     * @param {string} pathName 
     * @param {*} respHeader
     * @param {string} rangeHeader 
     */
    responsePartialContent:function(res,pathName,rangeHeader="bytes=0-"){		
        fs.open(pathName,"r",function(err,fd){
            if(err)
            {          
                res.writeHead(500);
                res.end();
                console.error(err);
                return;
            }

            var fileStat=fs.statSync(pathName);
            var range=serverUtility.parseHeaderRange(rangeHeader,fileStat.size);
            range=range[0];//Only take the first range parameter cause it is mostly used

            if(range.end-range.start>Number(serverConfig.maxPartialResponse))
            {
                range.end=range.start+Number(serverConfig.maxPartialResponse);
            }

            var resHeader=new classRespHeader();
            resHeader.pushHeader('Content-Type',mime.generateContentHeader(pathName)['Content-Type']);
            resHeader.pushHeader('Content-Range',"bytes " + range.start + "-" + range.end + "/" + fileStat.size);

            res.writeHead(206, resHeader.header);
            
            fs.read(fd,Buffer.alloc(range.end-range.start+1),0,range.end-range.start+1,range.start,function(err,byteRead,buffer){
                if(err)
                {           
                    res.writeHead(500);
                    res.end();
                    console.error(err);
                    return;
                }

                res.write(buffer);	
                res.end();							
            });
        });
    },
};

module.exports=serverUtility;