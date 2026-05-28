import { LiaCogSolid, LiaTachometerAltSolid, LiaUserSolid } from "react-icons/lia";
import SubPage1 from "../features/dashboard/Pages/SubPage1";
import { Outlet } from "react-router-dom";
import { MdAddShoppingCart } from "react-icons/md";

const childRoutes = {
    dashboard: [
        { path: "/dashboard/subpage1", element: <SubPage1 />, title: "Sub Page 1", icon: <MdAddShoppingCart /> },
        { path: "/dashboard/subpage2", element: <h1>Sub Page 2</h1>, title: "Sub Page 2", icon: <MdAddShoppingCart /> }
    ]
};

const ProtectedRouter = [
    { path: "/dashboard", element: <Outlet />, title: "Dashboard", icon: <LiaTachometerAltSolid />, childRoutes: childRoutes.dashboard },
    { path: "/profile", element: <h1>Profile</h1>, title: "Profile", icon: <LiaUserSolid /> },
    { path: "/settings", element: <h1>Settings</h1>, title: "Settings", icon: <LiaCogSolid /> },
]

export default ProtectedRouter;