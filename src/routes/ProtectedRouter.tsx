import { LiaCogSolid, LiaUserSolid } from "react-icons/lia";
import EscapePoints from "../features/library/Pages/EscapePoints";
import TripSource from "../features/library/Pages/TripSource";
import { TbShoppingBagSearch } from "react-icons/tb";
import { PiSuitcaseRolling } from "react-icons/pi";
import { RxDashboard } from "react-icons/rx";
import Profile from "../features/Profile/Pages/Profile";


const ProtectedRouter = [
    // top links
    { path: "/dashboard", element: <h1>Dashboard</h1>, title: "Dashboard", icon: <RxDashboard />, position: "top" },
    { path: "/escape-points", element: <EscapePoints />, title: "Escape Points", icon: <PiSuitcaseRolling />, position: "top" },
    { path: "trip-sources", element: <TripSource />, title: "Trip Sources", icon: <TbShoppingBagSearch />, position: "top" },

    // bottom links
    { path: "/settings", element: <h1>Settings</h1>, title: "Settings", icon: <LiaCogSolid />, position: "bottom" },
    
    // profile link
    { path: "/profile", element: <Profile />, title: "Profile", icon: <LiaUserSolid /> },

]

export default ProtectedRouter;