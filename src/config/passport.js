import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { prisma } from "./database.js";

export const configurePassport = () => {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${
            process.env.BASE_URL ||
            "https://chat-application-server-dof5.onrender.com"
          }/api/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await prisma.user.findFirst({
              where: { googleId: profile.id },
            });

            if (!user) {
              user = await prisma.user.findUnique({
                where: { email: profile.emails[0].value },
              });

              if (user) {
                user = await prisma.user.update({
                  where: { id: user.id },
                  data: { googleId: profile.id },
                });
              } else {
                user = await prisma.user.create({
                  data: {
                    googleId: profile.id,
                    email: profile.emails[0].value,
                    username:
                      profile.emails[0].value.split("@")[0] + "_" + Date.now(),
                    firstName: profile.name.givenName,
                    lastName: profile.name.familyName,
                    avatar: profile.photos[0].value,
                    provider: "google",
                  },
                });
              }
            }

            return done(null, user);
          } catch (error) {
            console.error("Google OAuth error:", error);
            return done(error, null);
          }
        }
      )
    );
  }

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET,
      },
      async (payload, done) => {
        try {
          const user = await prisma.user.findUnique({
            where: { id: payload.userId },
          });

          if (user) {
            return done(null, user);
          }
          return done(null, false);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
