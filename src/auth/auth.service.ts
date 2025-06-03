import { ForbiddenException, Injectable, Req } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { AuthDto } from "./dto";
import * as argon from 'argon2';

@Injectable({})
export class AuthService{
    constructor(private prisma: PrismaService) {}

    async signup(dto: AuthDto){
        // generate pass
        const hash = await argon.hash(dto.password);
        //save the new user in db
        const user = await this.prisma.user.create({
            data:{
                email:dto.email,
                hash, 
            }
        })
        // return user
        return user;
    }
    
    async signin(dto: AuthDto){
        //find the user
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        });
        //not exist throw excep
        if(!user){ throw new ForbiddenException('Credentials incorrect!'); }
        
        //compare pass
        const pwMatches = await argon.verify(
            user.hash, 
            dto.password
        );
        //pass inc throw excep
        if(!pwMatches){ throw new ForbiddenException('Credentials incorrect!'); }
        //send back the user
        return user;
    }
}
