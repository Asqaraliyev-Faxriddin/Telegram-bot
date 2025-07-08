type userState = 'firstname' | 'lastname' | 'age' | 'contact'

interface userData {
    step:userState,
    data:{
        firstname?:string,
        lastname?:string,
        age?:number,
        contact?:string
    }
}

export const UserState = new Map<number,userData>()