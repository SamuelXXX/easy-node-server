/**
 * Enum used to identify request url type
 */
const requestType={
    invalid:-1,
    /**
     * Main page request with nothing but a '/' in url
     */
    main:0,
    /**
     * Site with slash symbol at the end
     */
    site:1,
    /**
     * Pathname without slash symbol or file extension at the end 
     */
    untyped:2,
    /**
     * Request for resource file
     */
    resource:3,
    /**
     * Request for html page
     */
    page:4,

    /**
     * Check request type,request for a site or a certain file
     * @param {string} pathName Target url path to check request type
     */
    checkRequestType:function(pathName){
        var certainFilePatt=/(\/.+)+\.\w{1,8}$/i;
        var sitePatt=/(\/.+)*\/$/i;
        var untypedPatt=/(\/.+)*$/i;

        if(certainFilePatt.test(pathName))
        {
            var ext=pathName.match(/(?<=\.)\w{1,8}$/)[0];
            if(ext=="html"||ext=="htm")
            {
                return requestType.page;
            }
            else{
                return requestType.resource;
            }     
        }

        if(sitePatt.test(pathName))
        {
            if(pathName=="/")
            {
                return requestType.main;
            }
            else
                return requestType.site;
        }

        if(untypedPatt.test(pathName))
        {
            return requestType.untyped;
        }

        return requestType.invalid;
    }

};

module.exports=requestType;