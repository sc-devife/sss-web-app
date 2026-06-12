import { AiOutlineHome } from "react-icons/ai";
import { LiaCogSolid, LiaTachometerAltSolid, LiaUserSolid } from "react-icons/lia";
import { RxDashboard } from "react-icons/rx";
import DestinationsMangement from "../features/library/Pages/DestinationsMangement";



const ProtectedRouter = [
    // top links
    { path: "/home", element: <h1>Home</h1>, title: "Home", icon: <AiOutlineHome />, position: "top" },
    { path: "/dashboard", element: <h1>Dashboard</h1>, title: "Dashboard", icon: <LiaTachometerAltSolid />, position: "top" },
    { path: "/library", element: <DestinationsMangement />, title: "Library", icon: <RxDashboard />, position: "top" },

    // bottom links
    { path: "/settings", element: <h1>Settings</h1>, title: "Settings", icon: <LiaCogSolid />, position: "bottom" },
    
    // profile link
    { path: "/profile", element: <h1>Profile</h1>, title: "Profile", icon: <LiaUserSolid /> },

]

export default ProtectedRouter;