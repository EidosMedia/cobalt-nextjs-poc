import { DataObjectTwoTone, SixteenMp } from '@mui/icons-material';
import { xml2json } from 'xml-js'
import { searchCobalt } from './cobalt-api';

export function getCobaltDataHelper(data) {
    let helper = null;
    switch (data.sys.baseType) {
        case "webpage":
            return getCobaltWebPageHelper(data);
            break;
        case "webpagefragment":
            return getCobaltWebPageHelper(data);
            break;
        case "article":
            return getCobaltArticleHelper(data);
            break;
        case "liveblog":
            return getCobaltLiveblogHelper(data);
            break;
        default:
            return null;
    }
}

export function buildCobaltDataFromPage(pageData, siteStructure, site, url, previewData) {

    const helper = getCobaltDataHelper(pageData.model.data);

    let linkContext = null;
    if (previewData && pageData.model.data.sys.baseType === 'webpagefragment') {
        linkContext = {
            linkTemplate: helper.pageTemplate
        }
    }

    const cobaltData = {
        object: {
            data: pageData.model.data,
            helper: helper,
        },
        linkContext: linkContext,
        pageContext: {
            url: (url?url:pageData.model.data.url),
            nodes: pageData.model.nodes,
            resourcesUrls: pageData.resourcesUrls,
            nodesUrls: pageData.nodesUrls,
            children: pageData.model.children
        },
        siteContext: {
            site: site,
            siteStructure: siteStructure
        },
        previewData
    }
    return cobaltData
}

export function buildCobaltDataForNestedObject(object, parentCobaltData, linkContext) {
    const cobaltData = {
        object: {
            data: object,
            helper: getCobaltDataHelper(object)
        },
        linkContext,
        siteContext: parentCobaltData.siteContext,
        pageContext: parentCobaltData.pageContext,
        previewData: parentCobaltData.previewData
    }
    return cobaltData
}

export function getQueryResultObjects(cobaltData) {
    let resultObjects = [];
    try {
        resultObjects = cobaltData
            .object.data.children
            .filter((child) => {
                const objNodeData = cobaltData.pageContext.nodes[child]
                return isContentOnSite(objNodeData, getCurrentLiveSite(cobaltData))
            })
            .map((child) => {
                const objNodeData = cobaltData.pageContext.nodes[child]
                const linkContext = {
                    linkData: null,
                    linkTemplate: 'list'
                }
                const objCobaltData = buildCobaltDataForNestedObject(objNodeData, cobaltData, linkContext)
                return objCobaltData
            })
    } catch (e) { console.log(e) }

    return resultObjects
}

export function getSearchResultObjects(cobaltData) {
    let resultObjects = [];
    try {
        resultObjects = cobaltData
            .searchResults.result
            .map((child) => {
                const objNodeData = child.nodeData
                const linkContext = {
                    linkData: null,
                    linkTemplate: 'list'
                }
                const objCobaltData = buildCobaltDataForNestedObject(objNodeData, cobaltData, linkContext)
                return objCobaltData
            })
    } catch (e) { console.log(e) }

    return resultObjects
}

export function getSectionChildrenObjects(cobaltData) {
    let resultObjects = [];
    try {
        resultObjects = cobaltData.pageContext.children
            .map((child) => {
                const objNodeData = cobaltData.pageContext.nodes[child]
                const linkContext = {
                    linkData: null,
                    linkTemplate: 'list'
                }
                const objCobaltData = buildCobaltDataForNestedObject(objNodeData, cobaltData, linkContext)
                return objCobaltData
            })
    } catch (e) { console.log(e) }

    return resultObjects
}

export function getDwxLinkedObjects(cobaltData, zoneName) {
    if (!zoneName){
        // When not specifying a zone, return all objects from all zones
        const zones = Object.keys(cobaltData.object.data.files.content.data.zones)
        return zones.reduce((acc,zone) =>[...acc,...getDwxLinkedObjects(cobaltData,zone)],[])
    }

    let linkedObjects = [];
    try {
        linkedObjects = cobaltData.object.helper.zones
            .find((zone) => zone.zone === zoneName)
            .objects
            .map((link) => {
                // Here we need to build the cobaltData for each object

                const objNodeData = cobaltData.pageContext.nodes[link.objectId]

                let linkTemplate = null
                if (link.linkData && link.linkData.template) {
                    linkTemplate = link.linkData.template
                } else {
                    try {
                        linkTemplate = cobaltData.object.data.files.templates.data[cobaltData.linkContext.linkTemplate].zones[zoneName].sequences[0].styleSheet
                    } catch (e) {
                    }
                }
                if (!linkTemplate) {
                    //No default template found -> setting defaults
                    switch (objNodeData.sys.type) {
                        case 'featured': linkTemplate = 'featured_standard'; break;
                        case 'segment': linkTemplate = 'section_teaser'; break;
                        case 'article': linkTemplate = 'head-pic'; break;
                    }
                }

                const linkContext = {
                    linkData: link.linkData,
                    linkTemplate: linkTemplate
                }

                const objCobaltData = buildCobaltDataForNestedObject(objNodeData, cobaltData, linkContext)

                return objCobaltData
            })
    }
    catch (e) {
    }
    return linkedObjects
}

function getCobaltWebPageHelper(data) {

    const zones = Object.keys(data.files.content.data.zones)

    let zonesWithObjects = null;
    try {
        zonesWithObjects = zones.filter((zone) => data.links.pagelink[zone])
            .map((zone) => {
                return {
                    zone: zone,
                    objects: data.links.pagelink[zone].map((link) => {
                        return {
                            linkData: link.metadata,
                            objectId: link.targetId
                        }
                    })
                }
            })
    } catch (e) { }

    return {
        pageTemplate: data.files.content.data.pageTemplate,
        zones: zonesWithObjects
    }
}

function getCobaltArticleHelper(data) {
    let content = null;
    try {
        content = JSON.parse(xml2json(data.files.content.data))
    } catch (e) {
        console.log("error parsing object xml: " + e)
    }

    return {
        content
    };
}

function getCobaltLiveblogHelper(data) {
    let content = null;
    try {
        content = JSON.parse(xml2json(data.files.content.data))
    } catch (e) {
        console.log("error parsing object xml: " + e)
    }

    return {
        content
    };
}

export function getCobaltLiveblogPostHelper(data) {
    let content = null;
    try {
        content = JSON.parse(xml2json(data.files.content.data))
    } catch (e) {
        console.log("error parsing object xml: " + e)
    }

    return {
        content
    };
}

export function getSiteNameByHostName(hostName, sites) {
    let site = null
    if (sites != null && sites.length) {
        site = sites.find((site) => hostName === getLiveHostname(site))
        if (!site && process.env.DEV_MODE === 'true') {
            site = sites.find((site) => site.customAttributes.siteCategory === 'main')
        }
    }
    if (site) {
        return site.name
    } else {
        return null // will show a not found
    }
}

export function getLiveHostname(site){
    let liveHostname = null
    try {
        liveHostname = site.liveHostname.replace(/^https?\:\/\//i, "").split(':')[0]
    } catch(e){}
    return liveHostname

}

export function isContentOnSite(obj, site) {
    let result = false;

    const pubAttributes = obj.attributes.secondary_sections
    if (Array.isArray(pubAttributes)) {
        result = pubAttributes.some((attr) => attr.siteName === site)
    } else {
        result = pubAttributes.siteName === site
    }
    return result;
}

export function getObjectMainSite(obj) {
    const pubAttributes = obj.attributes.secondary_sections
    let siteName = null
    if (Array.isArray(pubAttributes)) {
        siteName = pubAttributes[0].siteName
    } else {
        siteName = pubAttributes.siteName
    }
    return siteName;
}

export function getObjectMainSection(obj) {
    const pubAttributes = obj.attributes.secondary_sections
    let section = null
    if (Array.isArray(pubAttributes)) {
        section = pubAttributes[0].mainSection
    } else {
        section = pubAttributes.mainSection
    }
    return section;
}

// Return the live site (without [PREVIEW] if there is)
export function getCurrentLiveSite(cobaltData){
    let currentSite = cobaltData.siteContext.site
    if (currentSite.includes('[PREVIEW]')){
        currentSite = currentSite.split('[')[0]
    }
    return currentSite   
}