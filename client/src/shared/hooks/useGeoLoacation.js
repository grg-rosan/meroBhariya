    // src/shared/hooks/useGeolocation.js
    import { useState } from "react";
    import { useToast } from "../context/ToastContext";

    export function useGeolocation() {
    const [loc, setLoc]         = useState(null);
    const [loading, setLoading] = useState(false);
    const toast = useToast()
    const request = () =>
        new Promise((resolve, reject) => {
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setLoc(coords);
            setLoading(false);
            resolve(coords);
            },
            (e) => {
            toast({message:e.message,type:"error"});
            setLoading(false);
            reject(e);
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
        });

    return { loc,loading, request };
    }