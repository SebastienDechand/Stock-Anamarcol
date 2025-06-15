import { GET_USER, UPDATE_NUMERO, UPLOAD_PICTURE } from "../actions/user.actions"

const initialState = {}

export default function userReducer(state = initialState, action) {
    switch (action.type) {
        case GET_USER: 
            return action.payload
        case UPLOAD_PICTURE:
            return {
                ...state, 
                picture: action.payload
            }
        case UPDATE_NUMERO:
            return {
                ...state,
                numero: action.payload
            }
        default: 
            return state
    }
}