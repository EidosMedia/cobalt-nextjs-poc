import { Container, Typography } from "@mui/material";
import { Box } from "@mui/system";
import Image from "next/image";
import { findElementsInContentJson, getImageUrl } from "../../utils/ContentUtil";
import ResourceResolver from "../../utils/ResourceResolver";
import RenderContentElement, { CloudinaryVideo } from "../RenderContent/RenderContentElement";

export default function DetailsPage({ cobaltData }) {
    let render = null;

    let headline = null;
    try {
        headline = <RenderContentElement jsonElement={findElementsInContentJson(['headline'], cobaltData.object.helper.content)[0]}/>
    } catch (e) { }

    let summary = null;
    try {
        summary = <RenderContentElement jsonElement={findElementsInContentJson(['summary'], cobaltData.object.helper.content)[0]} />
    } catch (e) { }

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

        mainImageUrl = ResourceResolver(getImageUrl(mainPictureElement, "landscape"), (cobaltData.previewData ? cobaltData.previewData : null), cobaltData.siteContext.site);
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

    let content = null;
    try {
        content = <RenderContentElement jsonElement={findElementsInContentJson(['content'], cobaltData.object.helper.content)[0]} renderMode='styled' previewData={cobaltData.previewData} site={cobaltData.siteContext.site}/>
    } catch (e) {
        console.log(e)
    }

    render = (
        <Container maxWidth="lg">
            <Container sx={{my:2}} maxWidth="md">
                <Box display="flex"
                    justifyContent="center"
                    alignItems="center">
                    <Typography variant="h3" component="h1">
                        {headline}
                    </Typography>
                </Box>
            </Container>
            {summary ?
                <Container sx={{my:2}} maxWidth="md">
                    <Box display="flex"
                        justifyContent="center"
                        alignItems="center">
                        <Typography variant="h5" component="h2">
                            {summary}
                        </Typography>
                    </Box>
                </Container>
                : null}
            <Container sx={{my:2}} maxWidth="lg">
                <Box display="flex"
                    justifyContent="center"
                    alignItems="center">
                    {mainMediaBlock}
                </Box>
            </Container>
            {content}
        </Container>
    )
    return render;
}