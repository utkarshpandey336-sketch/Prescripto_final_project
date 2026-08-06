import { createContext } from "react";

export const AppContext = createContext();

const AppContextProvider = (props) => {

    const currency = '$'
    const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // slotDate format: "D_M_YYYY" (matches backend/frontend booking convention)
    const slotDateFormat = (slotDate) => {
        if (!slotDate) return ''
        const dateArray = slotDate.split('_')
        return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
    }

    const calculateAge = (dob) => {
        if (!dob || dob === 'Not Selected') return 'N/A'
        const today = new Date()
        const birthDate = new Date(dob)
        let age = today.getFullYear() - birthDate.getFullYear()
        return age
    }

    const value = {
        currency,
        months,
        slotDateFormat,
        calculateAge
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;
