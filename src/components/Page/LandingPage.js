import { Box, Container, Typography } from "@mui/material";
import HTMLComment from "react-html-comment";
import { getCobaltDataHelper, getCurrentSite, getDwxLinkedObjects } from "../../lib/cobalt-cms/cobalt-helpers";
import GenericFragment from "../Fragment/GenericFragment";
import QuerySegment from "../Segment/QuerySegment";
import Segment from "../Segment/Segment";
import GenericWidget from "../Widgets/GenericWidget";

export default function LandingPage({ cobaltData, pageTitle, analyticsReport, semanticSearchData }) {
    const renderTest = (
        <Container maxWidth="lg">
            <Segment templateName="featured-big" />
            {/* <FeaturedSegment templateName="featured-big"/>
        <FeaturedSegment templateName="featured-condensed"/> */}
            <Segment templateName="section-teaser-big" />
            <Segment templateName="section-teaser" />
            <Segment templateName="section-teaser-big" />
            <Segment templateName="section-top" />
        </Container>
    )

    const mainObjects = getDwxLinkedObjects(cobaltData, "main");

    //Swing quick open
    let uuid = null;
    try {uuid = 'Methode uuid: "' + cobaltData.object.data.foreignId +'"'}catch(e){}

    const customColor = getCurrentSite(cobaltData).customAttributes.customColor;

    const render = (
        <Container maxWidth="lg">
             {uuid?<HTMLComment text={uuid}/>:null}
            {(pageTitle ?
                <Box sx={{ mb: 2, backgroundColor: (customColor?customColor:'secondary.main') }}
                    display="flex"
                    justifyContent="center"
                    alignItems="center">
                    <Typography sx={{ color: 'primary.main' }} variant="h4" component="h4">
                        {pageTitle}
                    </Typography>
                </Box> : null)}
            {mainObjects.map((obj, i) => {
                switch (obj.object.data.sys.baseType) {
                    case "webpagefragment":
                        return <Segment key={i} cobaltData={obj} analyticsReport={analyticsReport} />;
                        break;
                    case "query":
                        return <QuerySegment key={i} cobaltData={obj} />
                        break;
                    case "widget":
                        return <GenericWidget key={i} cobaltData={obj} semanticSearchData={semanticSearchData} />;
                        break;
                    case "article":
                        return <GenericFragment key={i} cobaltData={obj} gridContext={{ xs: 12, md: 3 }} analyticsReport={analyticsReport} />;
                        break;
                }

            })}
            
        </Container>

    )

    return render;
}