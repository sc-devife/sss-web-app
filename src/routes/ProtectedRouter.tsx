import { AiOutlineHome } from "react-icons/ai";
import { LiaCogSolid, LiaTachometerAltSolid, LiaUserSolid } from "react-icons/lia";
import EscapePoints from "../features/library/Pages/EscapePoints";
import { FaRoute } from "react-icons/fa";
import { RiRouteFill } from "react-icons/ri";



const ProtectedRouter = [
    // top links
    { path: "/home", element: <h1>Home</h1>, title: "Home", icon: <AiOutlineHome />, position: "top" },
    { path: "/dashboard", element: <h1>Dashboard</h1>, title: "Dashboard", icon: <LiaTachometerAltSolid />, position: "top" },
    { path: "/escape-points", element: <EscapePoints />, title: "Escape Points", icon: <RiRouteFill />, position: "top" },

    // bottom links
    { path: "/settings", element: <h1>Settings</h1>, title: "Settings", icon: <LiaCogSolid />, position: "bottom" },
    
    // profile link
    { path: "/profile", element: <h1>Profile</h1>, title: "Profile", icon: <LiaUserSolid /> },

]

export default ProtectedRouter;