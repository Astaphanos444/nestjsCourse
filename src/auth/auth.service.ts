import { ForbiddenException, Injectable, Req } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { AuthDto } from "./dto";
import * as argon from 'argon2';
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable({})
export class AuthService{
    constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService) {}

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
        return this.signToken(user.id, user.email);
    }
    
    async signin(dto: AuthDto){
        //find the user
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email }
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
        return this.signToken(user.id, user.email);
    }

    async signToken(userId: number, email: string): Promise<{access_token: string}>{
        const payload = { 
            sub: userId,
            email 
        }

        const secret = this.config.get('JWT_SECRET');

        const token =  await this.jwt.signAsync(payload, {
            expiresIn: '15m',
            secret: secret
        });

        return { 
            access_token: token 
        };
    }
}
