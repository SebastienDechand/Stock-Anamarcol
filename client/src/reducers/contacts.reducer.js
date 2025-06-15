import { 
    GET_CONTACT, 
    GET_ALL_CONTACTS, 
    SET_SELECTED_CONTACT_ID,
    UPLOAD_CONTACT_PICTURE, 
    SET_SELECTED_CONTACT_INFO,
    UPDATE_CONTACT 
} from "../actions/contacts.action"

const initialState = {
    selectedContactId: null,
    selectedContactInfo: null,
    contactsData: [],
}

export default function contactsReducer(state = initialState, action) {
    switch (action.type) {
        case GET_CONTACT: 
            return {
                ...state,
                contactsData: [action.payload]
            };
        case GET_ALL_CONTACTS: 
            return {
                ...state,
                contactsData: action.payload
            };
        case SET_SELECTED_CONTACT_ID:
            return {
                ...state,
                selectedContactId: action.payload ? action.payload._id : null,
                selectedContactInfo: action.payload || null,
            };
        case UPLOAD_CONTACT_PICTURE:
            return {
                ...state, 
                picture: action.payload
            }
        case SET_SELECTED_CONTACT_INFO:
            return {
                ...state,
                selectedContactInfo: action.payload,
            };
        case UPDATE_CONTACT:
            return {
                ...state,
                numero: action.payload
            }
        default: 
            return state
    }
}
