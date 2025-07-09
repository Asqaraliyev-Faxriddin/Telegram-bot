type userState = 'firstname' | 'lastname' | 'age' | 'contact'| "region"

interface userData {
    step:userState,
    data:{
        firstname?:string,
        lastname?:string,
        age?:number,
        contact?:string,
        region?:string
    }
}

export const UserState = new Map<number,userData>()