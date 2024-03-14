/**
 * LayoutWrapper lisää sivuun valikot ja mainokset.
 */

import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Box, Button, Divider, Drawer, IconButton, Toolbar, Typography, useMediaQuery } from "@mui/material";
import { SideNavigation } from "./SideNavigation";
import { BannerBox } from "./BannerBox";
import { ReactNode, useContext } from "react";
// import DraftsIcon from '@mui/icons-material/Drafts';
// import SendIcon from '@mui/icons-material/Send';
// import ExpandLess from '@mui/icons-material/ExpandLess';
// import ExpandMore from '@mui/icons-material/ExpandMore';
// import StarBorder from '@mui/icons-material/StarBorder';
// import InboxIcon from '@mui/icons-material/MoveToInbox';
import React from "react";
import { PageNameContext } from '../../contexts/PageNameContext';
import { AuthenticationContext } from '../../contexts/AuthenticationContext';
import { Link, useNavigate } from 'react-router-dom';

// const MenuList: React.FC<{ onClose: () => void }> = ({ onClose }) => {
//     return (
//         <List
//             sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}
//             component="nav"
//             aria-labelledby="nested-list-subheader"
//             subheader={
//                 <ListSubheader component="div" id="nested-list-subheader">
//                 Nested List Items
//                 </ListSubheader>
//             }
//             >
//             <ListItemButton>
//                 <ListItemIcon>
//                 <SendIcon />
//                 </ListItemIcon>
//                 <ListItemText primary="Sent mail" />
//             </ListItemButton>
//             <ListItemButton>
//                 <ListItemIcon>
//                     <DraftsIcon />
//                 </ListItemIcon>
//                 <ListItemText primary="Drafts" />
//             </ListItemButton>
//             <ListItemButton>
//                 <ListItemIcon>
//                 <InboxIcon />
//                 </ListItemIcon>
//                 <ListItemText primary="Inbox" />
//                 {true ? <ExpandLess /> : <ExpandMore />}
//             </ListItemButton>
//             <Collapse in={true} timeout="auto" unmountOnExit>
//                 <List component="div" disablePadding>
//                 <ListItemButton sx={{ pl: 4 }}>
//                     <ListItemIcon>
//                     <StarBorder />
//                     </ListItemIcon>
//                     <ListItemText primary="Starred" />
//                 </ListItemButton>
//                 </List>
//             </Collapse>
//         </List>
//     );
// };

const AuthenticationBlock: React.FC = () => {
    const authenticationContext = useContext(AuthenticationContext);
    const navigate = useNavigate();

    const logout = () => {
        authenticationContext.setFromToken(null);
        navigate("/");
    };

    return (
        <>
            {authenticationContext.isAuthenticated ?
                <Button color="inherit" onClick={logout}>
                    Logout
                </Button>
                :
                <Link to="/simulate_login" style={{color: "inherit"}}>
                    <Button color="inherit">Login</Button>
                </Link>
            }
            {authenticationContext.isAuthenticated &&
                <Typography textAlign="center" sx={{pl: 3}}>
                    {authenticationContext.name}
                    <br />
                    {authenticationContext.team}
                </Typography>
            }
        </>
    );
};

const ButtonAppBar = () => {
    const pageNameContext = useContext(PageNameContext);
    const [open, setOpen] = React.useState(false);

    const toggleDrawer = (newOpen: boolean) => {
        setOpen(newOpen);
    };

    const handleClick = (_event: React.MouseEvent<HTMLElement>) => {
        toggleDrawer(true);
    };

    return (
        <Box sx={{ flexGrow: 1, mb: 2, position: "relative" }}>
            <div
                style={{
                    position: 'absolute',
                    height: "100%",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    backgroundColor: 'rgba(0, 20, 1, 0.8)',
                }}
            />
            <AppBar 
                position="static" 
                sx={{
                    backgroundColor: "#001401",
                    backgroundImage: "url('Banneri.jpg')",
                    backgroundSize: "auto 100%",
                    backgroundRepeat: 'no-repeat',
                    opacity: "100%"
                }}
            >
                <Toolbar>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{ mr: 2 }}
                        onClick={handleClick}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography textAlign="left" variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {pageNameContext.pageName}
                    </Typography>
                    {/* <Typography textAlign="center" variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        East-Pool
                    </Typography> */}
                    <AuthenticationBlock />
                </Toolbar>
            </AppBar>
            <Drawer open={open} onClose={() => toggleDrawer(false)}>
                <SideNavigation />
            </Drawer>
        </Box>
    );
};

const LayoutWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
    const isMinimumL = useMediaQuery('(min-width: 992px)');
    const isMinimumXL = useMediaQuery('(min-width: 1200px)');

    return (
        <>
        {isMinimumL &&
        <Box overflow="hidden" width="100%" sx={{height: "163px", p: 0, m: 0, background: "#001401"}}>
            <img src="Banneri.jpg"/>
        </Box>
        }
        {!isMinimumL && <ButtonAppBar />}
        <Box display="flex" maxWidth="1200px">
            {/* Valikko vasemmalla */}
            {isMinimumL && <SideNavigation />}

            <Box width="100%" display="flex" flexDirection="column" sx={{p: 0, m: 0}}>
                {/* Itse sivun sisältö */}
                {children}

                <Divider sx={{ m: 2 }} />

                {/* Alamainokset */}
                <Box>
                    <BannerBox text="Ad 1"/>
                </Box>
                {!isMinimumXL &&
                <Box display="flex" flexWrap="wrap">
                    <BannerBox text="Ad A"/>
                    <BannerBox text="Ad B"/>
                    <BannerBox text="Ad C"/>
                </Box>
                }
            </Box>

            {/* Mainokset oikealla */}
            {isMinimumXL &&
            <Box>
                <BannerBox text="Ad A"/>
                <BannerBox text="Ad B"/>
                <BannerBox text="Ad C"/>
            </Box>
            }
        </Box>
        </>
    );
};

export { LayoutWrapper };