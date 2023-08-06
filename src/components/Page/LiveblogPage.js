import { Avatar, Container, Typography, styled } from "@mui/material";
import { Box } from "@mui/system";
import axios from "axios";
import HTMLComment from "react-html-comment";
import useSWR from "swr";
import { getCobaltLiveblogPostHelper, getCurrentLiveSite, getImageFormatUrl } from "../../lib/cobalt-cms/cobalt-helpers";
import { findElementsInContentJson, getImageUrl } from "../../utils/ContentUtil";
import RenderContentElement, { CloudinaryVideo } from "../RenderContent/RenderContentElement";
import RenderLiveblogPostElement from "../RenderContent/RenderLiveblogPostElement";
import ResourceResolver from "../../utils/ResourceResolver";
import Image from "next/image";
import SportsIcon from '@mui/icons-material/Sports';
import SportsSoccerSharpIcon from '@mui/icons-material/SportsSoccerSharp';
import CelebrationSharpIcon from '@mui/icons-material/CelebrationSharp';
import StyleSharpIcon from '@mui/icons-material/StyleSharp';
import React from 'react'

const fetcher = url => axios.get(url).then(res => res.data)

export default function LiveblogPage({ cobaltData }) {

    let render = null;

    //Swing quick open
    let uuid = null;
    try { uuid = 'Methode uuid: "' + cobaltData.object.data.foreignId + '"' } catch (e) { }

    if (cobaltData) {
        console.log(JSON.stringify(cobaltData.object.helper.content, null, 2))
        let data, error = null;
        ({ data, error } = useSWR('/api/' + getCurrentLiveSite(cobaltData) + '/liveblogs/' + cobaltData.object.data.id, fetcher, { refreshInterval: 5000, dedupingInterval: 0 }));

        let headline = null;
        try {
            headline = <RenderContentElement jsonElement={findElementsInContentJson(['headline'], cobaltData.object.helper.content)[0]} />
        } catch (e) { }

        let summary = null;
        try {
            summary = <RenderContentElement jsonElement={findElementsInContentJson(['summary'], cobaltData.object.helper.content)[0]} renderMode='styled' />
        } catch (e) { }

        let content = null;
        try {
            content = <RenderContentElement jsonElement={findElementsInContentJson(['content'], cobaltData.object.helper.content)[0]} renderMode='styled' cobaltData={cobaltData} />
        } catch (e) {
            console.log(e)
        }

        let reporters = null;
        try {
            reporters = cobaltData.object.data.attributes.liveblogData.lbNeutralReporters.map(r => {
                return {
                    authorId: r.lbNeutralReporterId,
                    authorName: r.lbNeutralReporterName,
                    authorRole: r.lbNeutralReporterRole,
                    authorPic: '/static/img/avatars/' + r.lbNeutralReporterId + '.jpg'
                }
            })
        } catch (e) { }

        let ambassadors = null;
        try {
            const gallery = findElementsInContentJson(['div'], cobaltData.object.helper.content)[0]
            ambassadors = gallery.elements.map((el) => {
                const authorName = el.elements.find((el2) => el2.name === 'person').elements[0].text
                const authorRole = el.elements.find((el2) => el2.name === 'description').elements[0].text
                let authorPic = el.elements.find((el2) => el2.name === 'img' && el2.attributes.class === 'square').attributes.src
                authorPic = ResourceResolver(authorPic, (cobaltData.previewData ? cobaltData.previewData : null), cobaltData.siteContext.site)
                return {
                    authorName,
                    authorRole,
                    authorPic,
                    isAmbassador: true
                }
            })
        } catch (e) { }

        let postsRender = null;

        if (error) postsRender = <div>Failed to load</div>
        if (!data) postsRender = <div>Loading...</div>
        if (!error && data) {
            postsRender = (
                <Container sx={{ my: 2 }} maxWidth="md">
                    {data.result.map((post, i, { length }) => {
                        let eventData = null;
                        let boxStyle = null;

                        try {
                            if (post.attributes.liveblogPostData.eventType) {
                                switch (post.attributes.liveblogPostData.eventType) {
                                    case '3':
                                        eventData = {
                                            eventText: 'Goal',
                                            eventIcon: <React.Fragment><SportsSoccerSharpIcon fontSize="large" color="secondary" /><CelebrationSharpIcon fontSize="large" color="secondary" /></React.Fragment>,
                                        };
                                        boxStyle = {
                                            border: 6,
                                            borderColor: 'green',
                                            my: 4,
                                            px: 2
                                        };
                                        break;
                                    case '2':
                                        eventData = {
                                            eventText: 'Red card',
                                            eventIcon: <StyleSharpIcon fontSize="large" sx={{ color: "#DC143C" }} />,
                                        };
                                        boxStyle = {
                                            border: 1,
                                            borderColor: 'grey.300',
                                            my: 4,
                                            px: 2
                                        };
                                        break;
                                    case '5':
                                        eventData = {
                                            eventText: 'Penalty',
                                            eventIcon: <SportsIcon fontSize="large" color="secondary" />,
                                        };
                                        boxStyle = {
                                            border: 4,
                                            borderColor: 'secondary.main',
                                            my: 4,
                                            px: 2
                                        };
                                        break;
                                    case '13':
                                        eventData = {
                                            eventText: 'Match start',
                                            eventIcon: <SportsIcon fontSize="large" color="secondary" />,
                                        };
                                        boxStyle = {
                                            border: 1,
                                            borderColor: 'grey.300',
                                            my: 4,
                                            px: 2
                                        };
                                        break;
                                    case '14':
                                        eventData = {
                                            eventText: 'Match end',
                                            eventIcon: <SportsIcon fontSize="large" color="secondary" />,
                                        };
                                        boxStyle = {
                                            border: 4,
                                            borderColor: 'grey.300',
                                            my: 4,
                                            px: 2
                                        };
                                        break;
                                }
                            }

                        } catch (error) { }

                        let postAuthor = null

                        // check if is ambassador
                        try {
                            if (ambassadors) {
                                postAuthor = ambassadors.find(a => a.authorName === post.attributes.liveblogPostData.postAmbassador)
                                if (postAuthor && !boxStyle) {
                                    boxStyle = {
                                        border: 4,
                                        borderColor: 'secondary.main',
                                        my: 4,
                                        px: 2
                                    }
                                }
                            }
                        } catch (error) { }

                        if (!postAuthor) {
                            // check if is reporter
                            try {
                                if (!post.attributes.liveblogPostData.forceNeutral) {
                                    let creator = post.attributes.creator.split(":")
                                    creator = creator[creator.length - 1]
                                    postAuthor = reporters.find((r => r.authorId === creator))
                                    if (postAuthor && !boxStyle) {
                                        boxStyle = {
                                            border: 1,
                                            borderColor: 'grey.500',
                                            my: 4,
                                            px: 2
                                        }
                                    }
                                }
                            } catch (error) { }
                        }

                        if (!boxStyle) {
                            boxStyle = {
                                border: (post.attributes.liveblogPostData.isSticky ? 4 : 1),
                                borderColor: (post.attributes.liveblogPostData.isSticky ? 'secondary.main' : 'grey.500'),
                                my: 4,
                                px: 2
                            }
                        }

                        const postContent = getCobaltLiveblogPostHelper(post);
                        let contentRender = null;
                        try {
                            contentRender = <RenderLiveblogPostElement jsonElement={findElementsInContentJson(['article'], postContent.content)[0]} renderMode='styled' rawPost={post} cobaltData={cobaltData} />
                        } catch (e) {
                            console.log(e)
                        }
                        if (contentRender) {
                            contentRender = (
                                <Box key={post.id} sx={boxStyle}>
                                    {eventData ?
                                        <Box sx={{ my: 1 }}
                                            display="flex"
                                            justifyContent="flexStart"
                                            alignItems="flexStart">
                                            <Box sx={{ mx: 1, my: 2 }}>
                                                {eventData.eventIcon}
                                            </Box>
                                            <Box sx={{ mx: 1, my: 2, flex: 1, alignItems: 'center' }}>
                                                {contentRender}
                                            </Box>
                                            <Box sx={{ mx: 1, my: 2, display: 'flex', marginLeft: 'auto' }}>
                                                <Typography variant="h6" component="div" color="secondary.main">
                                                    0'
                                                </Typography>
                                            </Box>
                                        </Box>
                                        : null}
                                    {!eventData && postAuthor ?
                                        <Box sx={{ borderBottom: 1, borderColor: 'secondary.main', my: 1 }}
                                            display="flex"
                                            justifyContent="flexStart"
                                            alignItems="flexStart">
                                            <Box sx={{ mx: 1, my: 2 }}>
                                                <Avatar alt={postAuthor.authorName} src={postAuthor.authorPic} />
                                            </Box>
                                            <Box sx={{ mx: 1, my: 2, display: 'flex', alignItems: 'center' }}>
                                                <Typography variant="h6" component="div" color="secondary.main">
                                                    {postAuthor.authorName}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ mx: 1, my: 2, display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
                                                <Typography variant="h6" component="div" color="secondary.main">
                                                    {postAuthor.authorRole}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        : null}
                                    {!eventData ? contentRender : null}
                                </Box>
                            )
                        }
                        return contentRender;
                    })}
                </Container>
            )
        }
        render = (
            <Container maxWidth="lg">
                {uuid ? <HTMLComment text={uuid} /> : null}
                <Container sx={{ my: 2 }} maxWidth="md">
                    <Box display="flex"
                        justifyContent="center"
                        alignItems="center">
                        <Typography align="center" variant="h3" component="h1" sx={{ fontStyle: 'italic', fontWeight: 'medium' }}>
                            {headline}
                        </Typography>
                    </Box>
                </Container>
                {summary ?
                    <Container sx={{ my: 2 }} maxWidth="md">
                        <Box display="flex"
                            justifyContent="center"
                            alignItems="center">
                            <Typography align="center" variant="h5" component="h2">
                                {summary}
                            </Typography>
                        </Box>
                    </Container>
                    : null}
                <MainImageBlock cobaltData={cobaltData} />
                {postsRender}
            </Container>
        )
    }
    return render;
}

function MainImageBlock({ cobaltData, styleVariant }) {
    let mainPictureElement = null;
    let mainImageUrl = null;
    let cloudinaryVideo = null;
    let extraElement = null;
    try {
        mainPictureElement = findElementsInContentJson(['mediagroup'], cobaltData.object.helper.content)[0].elements[0];
        extraElement = findElementsInContentJson(['extra'], cobaltData.object.helper.content);
        try {
            cloudinaryVideo = extraElement[0].elements.find((el) => {
                let found = false;
                try {
                    found = (el.attributes['emk-type'] == 'cloudinaryVideo')
                } catch (e) { }
                return found
            })
        } catch (e) { }

        mainImageUrl = ResourceResolver(getImageFormatUrl(getImageUrl(mainPictureElement, "landscape", cobaltData), 'large'), (cobaltData.previewData ? cobaltData.previewData : null), cobaltData.siteContext.site);
    } catch (e) {
        console.log(e)
    }

    const imageWidth = 1024;
    const imageHeight = 576;

    let mainMediaBlock = null;
    if (cloudinaryVideo) {
        mainMediaBlock = <CloudinaryVideo jsonElement={cloudinaryVideo} />
    } else if (mainImageUrl) {
        mainMediaBlock = <Image src={mainImageUrl} width={imageWidth} height={imageHeight} />
    }

    let justify = "center";
    let maxWidth = "md";
    if (styleVariant && styleVariant === "leftAligned") {
        justify = "left";
        maxWidth = "lg";
    }

    const render = (
        <Container sx={{ my: 2 }} maxWidth={maxWidth}>
            <Box display="flex"
                justifyContent={justify}
                alignItems={justify}>
                {mainMediaBlock}
            </Box>
        </Container>
    )
    return render;
}