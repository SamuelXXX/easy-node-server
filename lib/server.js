'use strict'
//Node js framework modules
var http = require("http");
var url = require("url");
var fs = require("fs");
var query=require("querystring");
var https=require("https");

//Lib modules
var servUtil = require("./server-util");
var reqType=require("./request-type");
var serverConfig=require("./server-config");

function start()
{
	function requestHandler(req,res)
	{
		servUtil.displayRequest(req);
		var pathName = url.parse(req.url).pathname;
		var queryObject=query.parse(url.parse(req.url).query);

		var postData="";
		req.on("data",function(chunk){
			//Implement post data processing here
			postData+=chunk;
		});
	
		req.on("end",function(){
			var rt=reqType.checkRequestType(pathName);
			pathName=serverConfig.root+pathName;
			switch(rt)
			{
				//Invalid request
				case reqType.invalid:
					res.writeHead(400);
					res.end();
					console.error("Bad request:"+pathName);
					break;
	
				//Request like '/XXX/XXX'
				case reqType.untyped:
					pathName += serverConfig.defaultFileExtension;
					if(fs.existsSync(pathName))
					{
						servUtil.responseHTMLPage(res,pathName);
					}
					else{
						servUtil.responsePageNotFound(res,serverConfig);
					}
					break;

				//Request like '/' 
				case reqType.main:
				pathName += serverConfig.defaultMainPage;
				if(fs.existsSync(pathName))
				{
					servUtil.responseRelocatedHTMLPage(res,pathName,req.url+serverConfig.defaultMainPage);
				}
				else{
					servUtil.responsePageNotFound(res,serverConfig);
				}
				break;
	
				//Request like '/XXX/XXX/' 
				case reqType.site:
					pathName += serverConfig.indexFile;
					if(fs.existsSync(pathName))
					{
						servUtil.responseHTMLPage(res,pathName);
					}
					else{
						servUtil.responsePageNotFound(res,serverConfig);
					}
					break;
				
				//Request like '/XXX/XXX/filename.ext'
				case reqType.resource:
					if(fs.existsSync(pathName))
					{					
						if(req.headers["range"]!=null)
						{
							servUtil.responsePartialContent(res,pathName,req.headers["range"]);
						}
						else{
							servUtil.responseFullContent(res,pathName);								
						}
					}
					else{
						servUtil.responseContentNotFound(res);
					}
					break;
	
				//Request like '/XXX/XXX/filename.htm(l)'
				case reqType.page:
					if(fs.existsSync(pathName))
					{
						servUtil.responseHTMLPage(res,pathName);
					}
					else{
						servUtil.responsePageNotFound(res,serverConfig);
					}
					break;
				default:
				break;
			}
		});
	}
	//Make it a 'https' server
	if(serverConfig.useSSL=="true")
	{
		var sslOption=
		{
			key:fs.readFileSync("./ssl/server.key"),
			cert:fs.readFileSync('./ssl/cert.pem'),
		}
		https.createServer(sslOption,requestHandler).listen(Number(serverConfig.port));//force to use 443 port when use https
		console.log("Https Server run @ " + serverConfig.port);
	}
	else
	{
		http.createServer(requestHandler).listen(Number(serverConfig.port));
		console.log("Http Server run @ " + serverConfig.port);
	}
		
	console.log("Web server root:" + serverConfig.root);
}

exports.start=start;


